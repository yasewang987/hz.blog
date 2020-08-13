# OAuth2 - 隐式授权

* 参考资料：[rfc6749](https://tools.ietf.org/html/rfc6749)
* dotnet完整代码参考：https://github.com/yasewang987/hz.identityserver

隐式模式是授权码模式的简化版，不需要通过客户端后台服务器，直接在浏览器中向认证服务器申请令牌，跳过了 `授权码` 这个步骤。

交互流程如下：

```
+----------+
| Resource |
|  Owner   |
|          |
+----------+
    ^
    |
    (B)
+----|-----+          Client Identifier     +---------------+
|         -+----(A)-- & Redirection URI --->|               |
|  User-   |                                | Authorization |
|  Agent  -|----(B)-- User authenticates -->|     Server    |
|          |                                |               |
|          |<---(C)--- Redirection URI ----<|               |
|          |          with Access Token     +---------------+
|          |            in Fragment
|          |                                +---------------+
|          |----(D)--- Redirection URI ---->|   Web-Hosted  |
|          |          without Fragment      |     Client    |
|          |                                |    Resource   |
|     (F)  |<---(E)------- Script ---------<|               |
|          |                                +---------------+
+-|--------+
  |    |
(A)  (G) Access Token
  |    |
  ^    v
+---------+
|         |
|  Client |
|         |
+---------+

Note: The lines illustrating steps (A) and (B) are broken into two
parts as they pass through the user-agent.
```

* A: 用户访问客户端，客户端将用户导向授权服务器的认证页（带上参数 `client_id`,`redirect_uri`作为可选项，如果注册客户端的时候已经保存了，就不需要带上了）
* B：用户填写认证信息（账号密码），发送给授权服务器认证
* C：（假设认证信息正确）授权服务器返回访问令牌（`access_token`）给客户端
* D: 浏览器向资源服务器发出请求，其中不包括上一步收到的Hash值
* E: 资源服务器返回一个网页，其中包含的代码可以获取Hash值中的令牌
* F: 浏览器执行上一步获得的脚本，提取出令牌
* G: 浏览器将令牌发给客户端

> 没有理解为什么需要DEF这几步，后面的实现中去掉了DEF步骤。

## 步骤解析

### 步骤A

请求参数介绍：

* `response_type`：授权返回的类型，此处固定为 `code`
* `client_id`：客户端注册到认证授权服务时分配的客户端id
* `redirect_uri`: （可选）code返回时的重定向地址
* `scope`：（可选）申请的权限范围
* `state`：一个随机值，认证服务器在回调的时候会原封不动返回

示例：

有个需要注意的地方，步骤 C，返回的 access_token 放在重定向 URL 的 Fragment 中，即锚点中， # 后面，例如
```
GET /authorize?response_type=token&client_id=s6BhdRkqt3&state=xyz
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

返回参数：

* `access_token`：访问令牌
* `token_type`：令牌类型，一般为 `bearer`
* `expires_in`：（可选）授权过期时间
* `scope`：（可选）授权范围
* `state`：一个随机值，认证服务器在回调的时候会原封不动返回

示例：

```
HTTP/1.1 302 Found
Location: http://example.com/cb#access_token=2YotnFZFEjr1zCsicMWpAA
          &state=xyz&token_type=example&expires_in=3600
```

dotnet代码实现：

```csharp
// 用户输入账号密码登陆之后，验证逻辑，并返回token给前端，前端负责跳转
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

> 后续步骤都没有去实现，个人觉得都已经拿到 `access_token` 了，就可以直接使用了