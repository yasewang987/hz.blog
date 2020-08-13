# OAuth2 - 授权码模式

* 参考资料：[rfc6749](https://tools.ietf.org/html/rfc6749)
* dotnet完整代码参考：https://github.com/yasewang987/hz.identityserver

授权码授予类型用于同时获得两个访问权限令牌和刷新令牌，并针对机密客户端进行了优化。由于这是基于重定向的流程，因此客户端必须能够与资源所有者的用户代理（通常是浏览器）进行交互，并能够通过重定向从授权服务器接收传入请求。

授权码模式是最完整，安全性最高的授权模式，也是最常用的一种模式

交互流程如下：

```
+----------+
| Resource |
|   Owner  |
|          |
+----------+
    ^
    |
    (B)
+----|-----+          Client Identifier      +---------------+
|         -+----(A)-- & Redirection URI ---->|               |
|  User-   |                                 | Authorization |
|  Agent  -+----(B)-- User authenticates --->|     Server    |
|          |                                 |               |
|         -+----(C)-- Authorization Code ---<|               |
+-|----|---+                                 +---------------+
  |    |                                         ^      v
(A)  (C)                                        |      |
  |    |                                         |      |
  ^    v                                         |      |
+---------+                                      |      |
|         |>---(D)-- Authorization Code ---------'      |
|  Client |          & Redirection URI                  |
|         |                                             |
|         |<---(E)----- Access Token -------------------'
+---------+       (w/ Optional Refresh Token)
```
> 步骤（A），（B）和（C）通过用户代理 (浏览器) 分为两部分。

* A: 用户访问客户端，客户端将用户导向授权服务器的认证页（带上参数 `client_id`,`redirect_uri`作为可选项，如果注册客户端的时候已经保存了，就不需要带上了）
* B：用户填写认证信息（账号密码），发送给授权服务器认证
* C：（假设认证信息正确）授权服务器返回授权码（`code`）给客户端
* D：客户端使用 `code`, `redirect_uri` 向授权服务器获取 `access_token` (这里的 redirect_uri 会与A步骤或客户端注册时填写的uri进行对比)
* E：（假设所有信息合法）授权服务器返回 `access_token` 和 `refresh_token` 给客户端

## 步骤解析

### 步骤A

请求参数介绍：

* `response_type`：授权返回的类型，此处固定为 `code`
* `client_id`：客户端注册到认证授权服务时分配的客户端id
* `redirect_uri`: （可选）code返回时的重定向地址
* `scope`：（可选）申请的权限范围
* `state`：一个随机值，认证服务器在回调的时候会原封不动返回

示例：

```
GET /authorize?response_type=code&client_id=s6BhdRkqt3&state=xyz
    &redirect_uri=https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb HTTP/1.1
Host: server.example.com
```

dotnet代码实现

```csharp
// 请求过来之后会显示用户登陆页
public IActionResult Authorize([FromHeader]AuthorizeOptions options)
{
    // 验证clientid
    if(!_clientService.ValidateClientId(options.client_id) || !_clientService.ValidateResponseType(options.response_type)) 
    {
        return RedirectToAction("Error", "Home", new { msg = "not exists client or error response_type"} );
    }
    var client = Client.AdminClient();
    ViewData["orgName"] = client.client_name;
    options.redirect_uri = client.redirect_uri;
    ViewData["options"] = options;
    return View();
}
```

### 步骤B，C

返回参数介绍：

* `code`：授权码，该码有效期一般都很短10分钟左右，并且只能使用一次
* `state`：请求中包含的数据原值返回

示例：

```
HTTP/1.1 302 Found
     Location: https://client.example.com/cb?code=SplxlOBeZQQYbYS6WxSbIA
               &state=xyz
```

dotnet代码实现

```csharp
// 用户输入账号密码登陆之后，验证逻辑，并返回code给前端，前端负责跳转
[HttpPost]
public IActionResult Submit([FromBody]LoginModel model)
{
    var adminUser = UserInfo.CreateAdminUser();
    if(adminUser.CheckUser(model.account, model.passwd))
    {
        var userid = adminUser.id;
        var code =  _keyFactory.GenerateCode();

        if (model.response_type.IsToken()) {
            // 隐式模式
            _cache.SetString(CacheKeyProvider.TokenKey(code), userid.ToString(), new DistributedCacheEntryOptions {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1)
            });
        } else {
            _cache.SetString(CacheKeyProvider.CodeKey(code), userid.ToString(), new DistributedCacheEntryOptions {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10)
            });
        }

        return Ok(code);
    }
    else {
        return Problem("账号或密码错误！");
    }
}
```
### 步骤D,E

请求参数介绍：

* `grant_type`：授权类型，此处固定为 `authorization_code`
* `code`：表示上一步获得的授权码
* `redirect_uri`：表示重定向 URI（与步骤A或者客户端注册的一致，逻辑中需要验证）
* `client_id`：（可选）客户端id

示例：

```
POST http://localhost:5000/auth/codetoken HTTP/1.1
Content-Type: application/json

{
  "grant_type": "authorization_code",
  "code": "519bb3ffd7734feb9daa69454846ed4e",
  "redirect_uri": "https://www.baidu.com"
}
```

返回参数：

* `access_token`：访问令牌
* `token_type`：令牌类型，一般为 `bearer`
* `expires_in`：（建议）过期时间，单位秒
* `refresh_token`：（可选）更新令牌
* `scope`：（可选）权限范围

示例：

```
HTTP/1.1 200 OK
Content-Type: application/json;charset=UTF-8
Cache-Control: no-store
Pragma: no-cache

{
  "access_token":"2YotnFZFEjr1zCsicMWpAA",
  "token_type":"example",
  "expires_in":3600,
  "refresh_token":"tGzv3JOkF0XG5Qx2TlKWIA",
  "example_parameter":"example_value"
}
```

dotnet代码实现：

```csharp
/// <summary>
/// 授权码模式
/// </summary>
/// <param name="options"></param>
/// <returns></returns>
[HttpPost]
public IActionResult CodeToken([FromBody]CodeTokenOptions options)
{
    // validate grant_type
    if(!options.ValidateGrantType()) {
        return Json(new {
            error = "error grant_type"
        });
    }

    var client = Client.AdminClient();
    // validate client
    if(client is null) {
        return Json(new {
            error = "invalid client"
        });
    }

    // validate redirect_uri
    if (!client.ValidateRedirectUri(options.redirect_uri)) {
        return Json(new {
            error = "error redirect_uri"
        });
    }
    // validate code
    if (!_clientService.ValidateCode(options.code)) {
        return Json(new {
            error = "invalid code"
        });
    }

    // return
    var userid = _clientService.GetUserIdByCode(options.code);
    
    var tokenResult = HandleToken(userid);

    return Json(tokenResult);
}

private TokenResult HandleToken(string userid)
{
    var token = _keyFactory.GenerateToken();
    var refreshToken = _keyFactory.GenerateToken();
    var tokenExpiresIn = 60*60*24; // 1天
    var refreshTokenExpiresIn = 60*60*24*365; // 1年

    var tokenResult = new TokenResult {
        access_token = token,
        refresh_token = refreshToken,
        expires_in = tokenExpiresIn,
        userid = userid
    };

    // 将access_token,refresh_token加入缓存
    _cache.SetString(CacheKeyProvider.TokenKey(token), userid, new DistributedCacheEntryOptions {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(tokenExpiresIn)
    });

    _cache.SetString(CacheKeyProvider.RefreshTokenKey(refreshToken), System.Text.Json.JsonSerializer.Serialize(tokenResult), new DistributedCacheEntryOptions {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(refreshTokenExpiresIn)
    });

    return tokenResult;
}
```

