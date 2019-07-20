# Dotnet发送Email

* 这里使用`MailKit`库，通过nuget安装即可

1. Controller编写

```csharp
[Route("api/[controller]")]
public class HomeController : Controller
{
    public IConfiguration Configuration { get; }

    public HomeController(IConfiguration configuration)
    {
        Configuration = configuration;
    }

    [HttpPost("/notice")]
    public IActionResult Notice()
    {
        var bytes = new byte[10240];
        var i = Request.Body.ReadAsync(bytes, 0, bytes.Length);
        var content = System.Text.Encoding.UTF8.GetString(bytes).Trim('\0');

        EmailSettings settings = new EmailSettings()
        {
            SmtpServer = Configuration["Email:SmtpServer"],
            SmtpPort = Convert.ToInt32(Configuration["Email:SmtpPort"]),
            AuthAccount = Configuration["Email:AuthAccount"],
            AuthPassword = Configuration["Email:AuthPassword"],
            ToWho = Configuration["Email:ToWho"],
            ToAccount = Configuration["Email:ToAccount"],
            FromWho = Configuration["Email:FromWho"],
            FromAccount = Configuration["Email:FromAccount"],
            Subject = Configuration["Email:Subject"]
        };

        EmailHelper.SendHealthEmail(settings, content);

        return Ok();
    }
}

// EmailSettings模型
public class EmailSettings
{
    public string SmtpServer {get; set;} // smtp.163.com
    public int SmtpPort {get; set;} // smtp端口一般为：25
    public string AuthAccount {get; set;} // 授权邮箱
    public string AuthPassword {get; set;} // 邮件发送授权码
    public string ToWho {get; set;} // 接收人
    public string ToAccount {get; set;} // 接收人邮箱
    public string FromWho {get; set;} // 发送人
    public string FromAccount {get; set;} // 发送人邮箱
    public string Subject {get; set;}  // 邮件主题 
}

```

1. SendHealthEmail方法编写

```csharp
public class EmailHelper
{
    public static void SendHealthEmail(EmailSettings settings, string content)
    {
        try
        {
            dynamic list = JsonConvert.DeserializeObject(content);
            if (list != null && list.Count > 0)
            {
                var emailBody = new StringBuilder("健康检查故障:\r\n");
                foreach (var noticy in list)
                {
                    emailBody.AppendLine($"--------------------------------------");
                    emailBody.AppendLine($"Node:{noticy.Node}");
                    emailBody.AppendLine($"Service ID:{noticy.ServiceID}");
                    emailBody.AppendLine($"Service Name:{noticy.ServiceName}");
                    emailBody.AppendLine($"Check ID:{noticy.CheckID}");
                    emailBody.AppendLine($"Check Name:{noticy.Name}");
                    emailBody.AppendLine($"Check Status:{noticy.Status}");
                    emailBody.AppendLine($"Check Output:{noticy.Output}");
                    emailBody.AppendLine($"--------------------------------------");
                }

                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(settings.FromWho, settings.FromAccount));
                message.To.Add(new MailboxAddress(settings.ToWho, settings.ToAccount));

                message.Subject = settings.Subject;
                message.Body = new TextPart("plain") { Text = emailBody.ToString() };
                using (var client = new SmtpClient())
                {
                    client.ServerCertificateValidationCallback = (s, c, h, e) => true;
                    client.Connect(settings.SmtpServer, settings.SmtpPort, false);
                    client.AuthenticationMechanisms.Remove("XOAUTH2");
                    client.Authenticate(settings.AuthAccount, settings.AuthPassword);
                    client.Send(message);
                    client.Disconnect(true);
                }
            }
        }
        catch(Exception ex)
        {
            Console.WriteLine(ex.Message);
        }
    }
}
```

1. 修改配置文件appsettings,添加如下内容：
```json
  "Email": {
    "SmtpServer": "smtp.163.com",
    "SmtpPort": "25",
    "AuthAccount": "你的邮箱",
    "AuthPassword": "授权码",
    "ToWho": "HZGOD",
    "ToAccount": "发送给谁",
    "FromWho": "HZCHECK",
    "FromAccount": "发件人邮箱",
    "Subject": "作业报警"
  }
```