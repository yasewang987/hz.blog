# OAuth2 - 客户端授权

* 参考资料：[rfc6749](https://tools.ietf.org/html/rfc6749)
* dotnet完整代码参考：https://github.com/yasewang987/hz.identityserver

客户端模式指客户端以自己的名义，而不是以用户的名义，向服务提供商进行认证。会出现多个用户使用同一个访问令牌（因为是以客户端的名字申请的令牌）

交互流程如下：

```
+---------+                                  +---------------+
|         |                                  |               |
|         |>--(A)- Client Authentication --->| Authorization |
| Client  |                                  |     Server    |
|         |<--(B)---- Access Token ---------<|               |
|         |                                  |               |
+---------+                                  +---------------+
```

* A：客户端使用自身在认证服务器中注册时获得的凭证（client_id, client_secret）向认证服务器索取令牌
* B：认证服务器核验通过后返回令牌等相关信息

## 步骤解析

### 步骤A，B

请求参数：

* `grant_type`：授权类型，这里固定为 `client_credentials`
* `client_id`：客户端id
* `client_secret`：客户端密钥
* `scope`：（可选）授权范围

示例：

```
POST http://localhost:5000/auth/clienttoken HTTP/1.1
Content-Type: application/json

{
  "grant_type": "client_credentials",
  "client_id": "AdminOrg",
  "client_secret": "123456"
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
/// 客户端模式
/// </summary>
/// <param name="options"></param>
/// <returns></returns>
[HttpPost]
public IActionResult ClientToken([FromBody]ClientOptions options)
{
    // validate grant_type
    if(!options.ValidateGrantType())
    {
        return Json(new { error = "error grant_type" });
    }

    // validate client
    var client = Client.AdminClient();
    if(client is null || !client.CheckClient(options.client_id, options.client_secret))
    {
        return Json(new { error = "invalid client"});
    }

    // return
    // use client_id as userid
    return Json(HandleToken(options.client_id));
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