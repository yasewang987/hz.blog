# OAuth2 - 刷新令牌

* 参考资料：[rfc6749](https://tools.ietf.org/html/rfc6749)
* dotnet完整代码参考：[https://github.com/yasewang987/hz.identityserver](https://github.com/yasewang987/hz.identityserver)


在 各个模式中，授权服务器可以会同时返回 `refresh_token`，用来在 `access_token` 过期前，重新获取新的 `access_token`，不需要用户重新确认授权，有助于提高用户体验。

交互流程如下：

```
+--------+                                           +---------------+
|        |--(A)------- Authorization Grant --------->|               |
|        |                                           |               |
|        |<-(B)----------- Access Token -------------|               |
|        |               & Refresh Token             |               |
|        |                                           |               |
|        |                            +----------+   |               |
|        |--(C)---- Access Token ---->|          |   |               |
|        |                            |          |   |               |
|        |<-(D)- Protected Resource --| Resource |   | Authorization |
| Client |                            |  Server  |   |     Server    |
|        |--(E)---- Access Token ---->|          |   |               |
|        |                            |          |   |               |
|        |<-(F)- Invalid Token Error -|          |   |               |
|        |                            +----------+   |               |
|        |                                           |               |
|        |--(G)----------- Refresh Token ----------->|               |
|        |                                           |               |
|        |<-(H)----------- Access Token -------------|               |
+--------+           & Optional Refresh Token        +---------------+
```

令牌刷新只涉及到了上面流程中的 G，H 2步。

* G：客户端携带 `refresh_token` 到认证服务器更新令牌
* H：认证服务器核验合法性之后，作废旧令牌，返回新的令牌等信息

## 步骤解析

### 步骤G，H

请求参数：

* `grant_type`：授权类型，这里固定为 `refresh_token`
* `refresh_token`：刷新令牌
* `scope`：（可选）授权范围

示例：

```
POST http://localhost:5000/auth/refreshtoken HTTP/1.1
Content-Type: application/json

{
  "grant_type": "refresh_token",
  "refresh_token": "4d3f3061e8e049689a586d8dfcba0d08"
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
/// 刷新令牌
/// </summary>
/// <param name="options"></param>
/// <returns></returns>
[HttpPost]
public IActionResult RefreshToken([FromBody]RefreshTokenOptions options)
{
    // validate grant_type
    if(!options.ValidateGrantType()) {
        return Json(new { error = "error grant_type"});
    }

    // validate refresh_token
    if(!_clientService.ValidateRefreshToken(options.refresh_token)) {
        return Json(new { error = "invalid refresh_token"});
    }

    // return
    var userid = _clientService.GetUserIdByRefreshToken(options.refresh_token);
    return Json(HandleToken(userid));
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