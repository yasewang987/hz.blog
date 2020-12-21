# dotnet单元测试

官网参考资料：https://docs.microsoft.com/zh-cn/dotnet/core/testing/unit-testing-best-practices

## 为什么需要单元测试

* 比执行功能测试节省时间

  > 功能测试费用高。 它们通常涉及打开应用程序并执行一系列你（或其他人）必须遵循的步骤，以验证预期的行为。 测试人员可能并不总是了解这些步骤，这意味着为了执行测试，他们必须联系更熟悉该领域的人。 对于细微更改，测试本身可能需要几秒钟，对于较大更改，可能需要几分钟。 最后，在系统中所做的每项更改都必须重复此过程。

  > 而单元测试只需按一下按钮即可运行，只需要几毫秒时间，且无需测试人员了解整个系统。 测试通过与否取决于测试运行程序，而非测试人员。

* 防止回归
  > 回归缺陷是在对应用程序进行更改时引入的缺陷。 测试人员通常不仅测试新功能，还要测试预先存在的功能，以验证先前实现的功能是否仍按预期运行。

  > 使用单元测试，可在每次生成后，甚至在更改一行代码后重新运行整套测试。 让你确信新代码不会破坏现有功能。

* 可执行文档
  > 在给定某个输入的情况下，特定方法的作用或行为可能并不总是很明显。 你可能会想知道：如果我将空白字符串传递给它，此方法会有怎样的行为？ Null?

  > 如果你有一套命名正确的单元测试，每个测试应能够清楚地解释给定输入的预期输出。 此外，它应该能够验证其确实有效。

* 减少耦合代码
  > 当代码紧密耦合时，可能难以进行单元测试。 如果不为编写的代码创建单元测试，则耦合可能不太明显。

  > 为代码编写测试会自然地解耦代码，因为采用其他方法测试会更困难。

## 优质单元测试的特征

* 快速。 对成熟项目进行数千次单元测试，这很常见。 应花非常少的时间来运行单元测试。 几毫秒。
* 独立。 单元测试是独立的，可以单独运行，并且不依赖文件系统或数据库等任何外部因素。
* 可重复。 运行单元测试的结果应该保持一致，也就是说，如果在运行期间不更改任何内容，总是返回相同的结果。
* 自检查。 测试应该能够在没有任何人工交互的情况下，自动检测测试是否通过。
* 及时。 与要测试的代码相比，编写单元测试不应花费过多不必要的时间。 如果发现测试代码与编写代码相比需要花费大量的时间，请考虑一种更易测试的设计。

## 代码覆盖率

高代码覆盖率百分比通常与较高的代码质量相关联。 但该度量值本身无法确定代码的质量。 设置过高的代码覆盖率百分比目标可能会适得其反。 假设一个复杂的项目有数千个条件分支，并且假设你设定了一个 95% 代码覆盖率的目标。 该项目当前维保持 90% 的代码覆盖率。 要覆盖剩余 5% 的所有边缘事例，需要花费巨大的工作量，而且价值主张会迅速降低。

高代码覆盖率百分比不指示成功，也不意味着高代码质量。 它仅仅表示单元测试所涵盖的代码量。

## 使用相同的术语

Fake - Fake 是一个通用术语，可用于描述 stub 或 mock 对象。 它是 stub 还是 mock 取决于使用它的上下文。 也就是说，Fake 可以是 stub 或 mock。

**Mock** - Mock 对象是系统中的 fake 对象，用于确定单元测试是否通过。 Mock 起初为 Fake，直到对其断言。

```csharp
var mockOrder = new FakeOrder();
var purchase = new Purchase(mockOrder);

purchase.ValidateOrders();

Assert.True(mockOrder.Validated);
```

在这种情况下，检查 Fake 上的属性（对其进行断言），因此在以上代码片段中，mockOrder 是 Mock。

**Stub** - Stub 是系统中现有依赖项（或协作者）的可控制替代项。 通过使用 Stub，可以在无需使用依赖项的情况下直接测试代码。 默认情况下，fake 起初为 Stub。

```csharp
var stubOrder = new FakeOrder();
var purchase = new Purchase(stubOrder);

purchase.ValidateOrders();

Assert.True(purchase.CanBeShipped);
```

在上述示例中，FakeOrder 用作 stub。 在断言期间，没有以任何形状或形式使用 FakeOrder。 FakeOrder 传递到 Purchase 类，以满足构造函数的要求。

> 关于 mock 与 stub 需要注意的一个重点是，mock 与 stub 很像，但可以针对 mock 对象进行断言，而不针对 stub 进行断言。

## 最佳实践

编写单元测试时，尽量不要引入基础结构依赖项。 这些依赖项会降低测试速度，使测试更加脆弱，应将其保留供集成测试使用。 可以通过遵循 `Explicit Dependencies Principle`（显式依赖项原则）和使用 `Dependency Injection`（依赖项注入）避免应用程序中的这些依赖项。 还可以将单元测试保留在单独的项目中，与集成测试相分隔。 这可确保单元测试项目没有引用或依赖于基础结构包。

### 为测试命名

命名标准非常重要，因为它们明确地表达了测试的意图。

测试的名称应包括三个部分：
* 要测试的方法的名称。
* 测试的方案。
* 调用方案时的预期行为。

测试不仅能确保代码有效，还能提供文档。 只需查看单元测试套件，就可以在不查看代码本身的情况下推断代码的行为。 此外，测试失败时，可以确切地看到哪些方案不符合预期。

```csharp
// bad
[Fact]
public void Test_Single()
{
    var stringCalculator = new StringCalculator();

    var actual = stringCalculator.Add("0");

    Assert.Equal(0, actual);
}

// good
[Fact]
public void Add_SingleNumber_ReturnsSameNumber()
{
    var stringCalculator = new StringCalculator();

    var actual = stringCalculator.Add("0");

    Assert.Equal(0, actual);
}
```

### 安排测试

“Arrange、Act、Assert”是单元测试时的常见模式。 顾名思义，它包含三个主要操作：

* 安排对象，根据需要对其进行创建和设置。
* 作用于对象。
* 断言某些项按预期进行。

明确地将要测试的内容从“arrange”和“assert”步骤分开 。

降低将断言与“Act”代码混杂的可能性。

可读性是编写测试时最重要的方面之一。 在测试中分离这些操作会明确地突出显示调用代码所需的依赖项、调用代码的方式以及尝试断言的内容。 虽然可以组合一些步骤并减小测试的大小，但主要目标是使测试尽可能可读。

```csharp
// bad
[Fact]
public void Add_EmptyString_ReturnsZero()
{
    // Arrange
    var stringCalculator = new StringCalculator();

    // Assert
    Assert.Equal(0, stringCalculator.Add(""));
}

// good
[Fact]
public void Add_EmptyString_ReturnsZero()
{
    // Arrange
    var stringCalculator = new StringCalculator();

    // Act
    var actual = stringCalculator.Add("");

    // Assert
    Assert.Equal(0, actual);
}
```

### 以最精简方式编写通过测试

单元测试中使用的输入应为最简单的输入，以便验证当前正在测试的行为。

* 测试对代码库的未来更改更具弹性。
* 更接近于测试行为而非实现。

包含比通过测试所需信息更多信息的测试更可能将错误引入测试，并且可能使测试的意图变得不太明确。 编写测试时需要将重点放在行为上。 在模型上设置额外的属性或在不需要时使用非零值，只会偏离所要证明的内容。

```csharp
// bad
[Fact]
public void Add_SingleNumber_ReturnsSameNumber()
{
    var stringCalculator = new StringCalculator();

    var actual = stringCalculator.Add("42");

    Assert.Equal(42, actual);
}

// good
[Fact]
public void Add_SingleNumber_ReturnsSameNumber()
{
    var stringCalculator = new StringCalculator();

    var actual = stringCalculator.Add("0");

    Assert.Equal(0, actual);
}
```

### 避免魔幻字符串

单元测试中的命名变量和生产代码中的命名变量同样重要。 单元测试不应包含魔幻字符串。

* 测试读者无需检查生产代码即可了解值的特殊之处。
* 明确地显示所要证明的内容，而不是显示要完成的内容 。

```csharp
// bad
[Fact]
public void Add_BigNumber_ThrowsException()
{
    var stringCalculator = new StringCalculator();

    Action actual = () => stringCalculator.Add("1001");

    Assert.Throws<OverflowException>(actual);
}

// good
[Fact]
void Add_MaximumSumResult_ThrowsOverflowException()
{
    var stringCalculator = new StringCalculator();
    const string MAXIMUM_RESULT = "1001";

    Action actual = () => stringCalculator.Add(MAXIMUM_RESULT);

    Assert.Throws<OverflowException>(actual);
}
```

### 在测试中应避免逻辑

* 降低在测试中引入 bug 的可能性。
* 专注于最终结果，而不是实现细节。

```csharp
// bad
[Fact]
public void Add_MultipleNumbers_ReturnsCorrectResults()
{
    var stringCalculator = new StringCalculator();
    var expected = 0;
    var testCases = new[]
    {
        "0,0,0",
        "0,1,2",
        "1,2,3"
    };

    foreach (var test in testCases)
    {
        Assert.Equal(expected, stringCalculator.Add(test));
        expected += 3;
    }
}

// good
[Theory]
[InlineData("0,0,0", 0)]
[InlineData("0,1,2", 3)]
[InlineData("1,2,3", 6)]
public void Add_MultipleNumbers_ReturnsSumOfNumbers(string input, int expected)
{
    var stringCalculator = new StringCalculator();

    var actual = stringCalculator.Add(input);

    Assert.Equal(expected, actual);
}
```

### 更偏好 helper 方法而非 setup 和 teardown

在实际的项目中还是经常会用到mock中的setup,一般使用例子如下：

```csharp
[Fact]
public void PersonAge_SinglePerson_ReturnsAge()
{
    IFoo foo = Mock.Of<IFoo>();
    var mockFoo = Mock.Get(foo);
    Person person = new Person() {
        Name = "name",
        Age = 100
    };

    // Verifiable标记之后，表示这个mock的方法必须被执行到，不然后面的mockFoo.Verify();就会报错
    // It.Is()标记的参数在Verify()方法被调用时会去校验方法的参数是否符合预期，如果不符合单测会报错无法通过
    // It.IsAny()标记的参数则不校验
    // 如果没有调用Verify()方法，则It.Is()的参数校验是没有作用的，负责另外一个值也不报错
    mockFoo.Setup(x => x.PersonAge(It.Is<Person>( p=> p.Name == person.Name && p.Age == person.Age))).Returns(person.Age).Verifiable();

    Person person2 = new Person() {
        Name = "name2",
        Age = 10
    }; 
    
    var age = foo.PersonAge(person2);

    // mockFoo.Verify();
}
```

如果测试需要类似的对象或状态，那么比起使用 Setup 和 Teardown 属性（如果存在），更偏好使用 helper 方法。

* 读者阅读测试时产生的困惑减少，因为每个测试中都可以看到所有代码。
* 给定测试的设置过多或过少的可能性降低。
* 在测试之间共享状态（这会在测试之间创建不需要的依赖项）的可能性降低。

在单元测试框架中，在测试套件的每个单元测试之前调用 Setup。 虽然有些人可能会将其视为有用的工具，但它通常最终导致庞大且难懂的测试。 每个测试通常有不同的要求，以使测试启动并运行。 遗憾的是，Setup 迫使你对每个测试使用完全相同的要求。

```csharp
// bad
private readonly StringCalculator stringCalculator;
public StringCalculatorTests()
{
    stringCalculator = new StringCalculator();
}
[Fact]
public void Add_TwoNumbers_ReturnsSumOfNumbers()
{
    var result = stringCalculator.Add("0,1");

    Assert.Equal(1, result);
}

// good
[Fact]
public void Add_TwoNumbers_ReturnsSumOfNumbers()
{
    var stringCalculator = CreateDefaultStringCalculator();

    var actual = stringCalculator.Add("0,1");

    Assert.Equal(1, actual);
}
private StringCalculator CreateDefaultStringCalculator()
{
    return new StringCalculator();
}
```

### 避免多个断言

在编写测试时，请尝试每次测试只包含一个 Assert。 仅使用一个 assert 的常用方法包括：
* 为每个 assert 创建单独的测试。
* 使用参数化测试。

将多个断言引入测试用例时，不能保证所有断言都会执行。 在大多数单元测试框架中，一旦断言在单元测试中失败，则进行中的测试会自动被视为失败。 这可能会令人困惑，因为正在运行的功能将显示为失败。

> 此规则的一个常见例外是对对象进行断言。 在这种情况下，通常可以对每个属性进行多次断言，以确保对象处于所预期的状态。

```csharp
// bad
[Fact]
public void Add_EdgeCases_ThrowsArgumentExceptions()
{
    Assert.Throws<ArgumentException>(() => stringCalculator.Add(null));
    Assert.Throws<ArgumentException>(() => stringCalculator.Add("a"));
}

// good
[Theory]
[InlineData(null)]
[InlineData("a")]
public void Add_InputNullOrAlphabetic_ThrowsArgumentException(string input)
{
    var stringCalculator = new StringCalculator();

    Action actual = () => stringCalculator.Add(input);

    Assert.Throws<ArgumentException>(actual);
}
```

### 通过单元测试公共方法验证专有方法

在大多数情况下，不需要测试专用方法。 专用方法是实现细节。 可以这样认为：专用方法永远不会孤立存在。 在某些时候，存在调用专用方法作为其实现的一部分的面向公共的方法。 你应关心的是调用到专用方法的公共方法的最终结果。

请考虑下列情形

```csharp
public string ParseLogLine(string input)
{
    var sanitizedInput = TrimInput(input);
    return sanitizedInput;
}

private string TrimInput(string input)
{
    return input.Trim();
}
```

你的第一反应可能是开始为 TrimInput 编写测试，因为想要确保该方法按预期工作。 但是，ParseLogLine 完全有可能以一种你所不期望的方式操纵 sanitizedInput，使得对 TrimInput 的测试变得毫无用处。

真正的测试应该针对面向公共的方法 ParseLogLine 进行，因为这是你最终应该关心的。

```csharp
public void ParseLogLine_StartsAndEndsWithSpace_ReturnsTrimmedResult()
{
    var parser = new Parser();

    var result = parser.ParseLogLine(" a ");

    Assert.Equals("a", result);
}
```

### Stub 静态引用

单元测试的原则之一是其必须完全控制被测试的系统。 当生产代码包含对静态引用（例如 DateTime.Now）的调用时，这可能会存在问题。 考虑下列代码

```csharp
public int GetDiscountedPrice(int price)
{
    if (DateTime.Now.DayOfWeek == DayOfWeek.Tuesday)
    {
        return price / 2;
    }
    else
    {
        return price;
    }
}
```

如何对此代码进行单元测试？ 可以尝试一种方法，例如

```csharp
public void GetDiscountedPrice_NotTuesday_ReturnsFullPrice()
{
    var priceCalculator = new PriceCalculator();

    var actual = priceCalculator.GetDiscountedPrice(2);

    Assert.Equals(2, actual)
}

public void GetDiscountedPrice_OnTuesday_ReturnsHalfPrice()
{
    var priceCalculator = new PriceCalculator();

    var actual = priceCalculator.GetDiscountedPrice(2);

    Assert.Equals(1, actual);
}
```

要解决这些问题，需要将“seam”引入生产代码中。 一种方法是在接口中包装需要控制的代码，并使生产代码依赖于该接口。

```csharp
public interface IDateTimeProvider
{
    DayOfWeek DayOfWeek();
}

public int GetDiscountedPrice(int price, IDateTimeProvider dateTimeProvider)
{
    if (dateTimeProvider.DayOfWeek() == DayOfWeek.Tuesday)
    {
        return price / 2;
    }
    else
    {
        return price;
    }
}
```

测试代码如下：

```csharp
public void GetDiscountedPrice_NotTuesday_ReturnsFullPrice()
{
    var priceCalculator = new PriceCalculator();
    var dateTimeProviderStub = new Mock<IDateTimeProvider>();
    dateTimeProviderStub.Setup(dtp => dtp.DayOfWeek()).Returns(DayOfWeek.Monday);

    var actual = priceCalculator.GetDiscountedPrice(2, dateTimeProviderStub);

    Assert.Equals(2, actual);
}

public void GetDiscountedPrice_OnTuesday_ReturnsHalfPrice()
{
    var priceCalculator = new PriceCalculator();
    var dateTimeProviderStub = new Mock<IDateTimeProvider>();
    dateTimeProviderStub.Setup(dtp => dtp.DayOfWeek()).Returns(DayOfWeek.Tuesday);

    var actual = priceCalculator.GetDiscountedPrice(2, dateTimeProviderStub);

    Assert.Equals(1, actual);
}
```

现在，测试套件可以完全控制 DateTime.Now，并且在调用方法时可以存根任何值。

## 测试cs文件命名

对于要测试的类中的每个方法都可以独立一个cs文件，例如

```
被测试类名：myClass，类中有2个方法需要被测试：myMethod1,myMethod2

那测试类可以定成2个：myClass_myMethod1.cs , myClass_myMethod2.cs
```

## 运行选择性单元测试

官方参考：https://docs.microsoft.com/zh-cn/dotnet/core/testing/order-unit-tests?pivots=xunit

```bash
dotnet test --filter ...
```

例子：

```bash
# ! 是保留字符，需要通过 \ 转义
dotnet test --filter FullyQualifiedName\!~IntegrationTests

# 对于包含泛型类型参数的逗号的 FullyQualifiedName 值，请使用 %2C 来转义逗号
dotnet test --filter "FullyQualifiedName=MyNamespace.MyTestsClass<ParameterType1%2CParameterType2>.MyTestMethod"

# 仅运行一个测试，即 XUnitNamespace.TestClass1.Test1
dotnet test --filter DisplayName=XUnitNamespace.TestClass1.Test1

# 运行除 XUnitNamespace.TestClass1.Test1 之外的其他所有测试。
dotnet test --filter FullyQualifiedName!=XUnitNamespace.TestClass1.Test1

# 运行显示名称包含 TestClass1 的测试
dotnet test --filter DisplayName~TestClass1

# 运行 FullyQualifiedName 包含 XUnit 的测试
dotnet test --filter XUnit

# 运行包含 [Trait("Category", "CategoryA")] 的测试
dotnet test --filter Category=CategoryA

# 运行 FullyQualifiedName 中包含 TestClass1 或 Trait 的键为 "Category" 且值为 "CategoryA" 的测试
dotnet test --filter "FullyQualifiedName~TestClass1|Category=CategoryA"

# 运行 FullyQualifiedName 中包含 TestClass1 且 Trait 的键为 "Category" 且值为 "CategoryA" 的测试
dotnet test --filter "FullyQualifiedName~TestClass1&Category=CategoryA"

# 运行 FullyQualifiedName 中包含 TestClass1 且 Trait 的键为 "Category" 且值为 "CategoryA" 或 Trait 的键为 "Priority" 且值为 1 的测试
dotnet test --filter "(FullyQualifiedName~TestClass1&Category=CategoryA)|Priority=1"
```

## 对单元测试排序

官方参考地址：https://docs.microsoft.com/zh-cn/dotnet/core/testing/order-unit-tests?pivots=xunit

## 将代码覆盖率用于单元测试

官方参考地址：https://docs.microsoft.com/zh-cn/dotnet/core/testing/unit-testing-code-coverage?tabs=linux

## 对已发布的dll文件进行单测

官方参考地址：https://docs.microsoft.com/zh-cn/dotnet/core/testing/unit-testing-published-output


