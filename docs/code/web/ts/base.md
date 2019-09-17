# TypeScript基础教程

## 安装
```bash
# 全局安装ts，当然也可以安装到工作目录
$ npm install -g typescript
```
确认是否安装成功
```
$ tsc --version
Version 1.2.3
```

## 编译文件

```bash
# 编译之后会生成js以及d.ts文件
$ tsc main.ts

# 添加编译参数
$ tsc --target es3 main.ts
```
查看完整的编译参数可以使用`tsc -h`查看或者查询[官网编译参数](https://www.typescriptlang.org/docs/handbook/compiler-options.html)

## 初始化配置文件

每次编译时都手工输入编译参数比较繁琐，而且容易出错，所以我们可以通过创建`tsconfig.json`文件指定编译参数。
```bash
# 通过init初始化项目会自动创建tsconfig.json
$ tsc --init
```
生成后的`tsconfig.json`文件中的包含完整的配置，不过很多被注释掉（不启用），如果需要可以自行开启。

## TypeScript基础类型

`TypeScript`作为`JavaScript`超集，将上面的数据类型进行了扩充，在`TypeScript`中可以通过各种组合创建出更加复杂的数据类型，同时`TypeScript`让数据类型固定，成为静态可分析的。

## Boolean

```ts
let isBool: boolean = false;

function hasToken(token: string): boolean {
    return token === '123'
}

const hasToken2 = (token: string): boolean => {
    return token === '123'
}
```

## Number

```ts
let numberTest: number = 6 
```

## String

```ts
let stringTest: string = "Apple";
```

## Symbol
ES6 中新增，由`Symbol()`返回的类型,会生成唯一值

```ts
let sym = Symbol();
let sym2 = Symbol();
console.log(sym === sym2)  // false
console.log(typeof sym) // symbol
console.log(sym.toString()) // Symbol()

// 使用场景（枚举时不需要每一个选项都考虑一下赋值）
class Test1 {
  public CASE1 = Symbol()
  public CASE2 = Symbol()

  public Method1 = (type: symbol): string => {

    let result: string  = ""
    switch (type) {
      case this.CASE1:
       result = "CASE1"
        break;
      case this.CASE2:
        result = "CASE2"
        break;
      default:
        result = "CASE_DEFAULT"
        break;
    }
    return result
  }
}

const test = new Test1()
console.log(test.Method1(test.CASE1)) // 'CASE1'
console.log(test.Method1(test.CASE2)) // 'CASE2'
console.log(test.Method1(Symbol())) // 'CASE_DEFAULT'


const PROP_NAME = Symbol()
const PROP_AGE = Symbol()
let SymObj = {
    [PROP_NAME]: 'hzts'
}
SymObj[PROP_AGE] = 10
console.log(obj[PROP_NAME]) // 'hzts'
console.log(obj[PROP_AGE]) // 10

let obj = {
   [Symbol('name')]: 'hzts',
   age: 18,
   title: 'Engineer'
}

Object.keys(obj)   // ['age', 'title']

for (let p in obj) {
   console.log(p)   // 分别会输出：'age' 和 'title'
}
// 当使用JSON.stringify()将对象转换成JSON字符串的时候，Symbol属性也会被排除在输出内容之外
JSON.stringify(obj)  // {"age":18,"title":"Engineer"}

Object.getOwnPropertyNames(obj)   // ['age', 'title']
// 使用Object的API
Object.getOwnPropertySymbols(obj) // [Symbol(name)]

// 使用新增的反射API
Reflect.ownKeys(obj) // [Symbol(name), 'age', 'title']
```
注意，因为是新特性，需要在`tsconfig.json`中添加相应的库支持，否则编译会报错
```json
{
    "lib": ["dom","es2015"] /* Specify library files to be included in the compilation. */
}
```

## Object

```ts
function create(source: Object) {
  return Object.create(source);
}

// ✅
create({});
// ✅
create(window);

// 🚨Argument of type 'undefined' is not assignable to parameter of type 'Object'
create(null);

// 🚨Argument of type 'undefined' is not assignable to parameter of type 'Object'.ts(2345)
create(undefined);
```

## Null、Undefined
这2个类型是其他类型的子类型
```ts
// 未开启强类型检查 strict:false
let age: number;
// 开启强类型 strict:true
let age: number | null | undefined

// 变量定义后没有初始化
console.log(age); // undefined

age = 9;
console.log(age); // 9

// 把变量的值取消，将其置空时
age = null;
console.log(age); // null
```

## Any
表示任意类型
```ts
let someVar: any
someVar = "饭后百步走，活到 99"
someVar = 99
someVar = undefined
someVar = null
```

## Void
常用于函数没有返回值
```ts
function foo(): void {
    console.log('12')
}
```

## Nerver
表示的是那些永不存在的值的类型。例如，`never`类型是那些总是会抛出异常或根本就不会有返回值的函数表达式或箭头函数表达式的返回值类型； 变量也可能是`never`类型，当它们被永不为真的类型保护所约束时。

`never`类型是任何类型的子类型，也可以赋值给任何类型；然而，没有类型是`never`的子类型或可以赋值给`never`类型（除了`never`本身之外）。 即使 any也不可以赋值给never
```ts
interface Square {
  kind: "square";
  size: number;
}
interface Rectangle {
  kind: "rectangle";
  width: number;
  height: number;
}
interface Circle {
  kind: "circle";
  radius: number;
}

type Shape = Square | Rectangle | Circle;

// 返回never的函数必须存在无法达到的终点
function assertNever(x: never): never {
  throw new Error("Unexpected object: " + x);
}

function area(s: Shape) {
  switch (s.kind) {
    case "square":
      return s.size * s.size;
    case "rectangle":
      return s.height * s.width;
    case "circle":
      return Math.PI * s.radius ** 2;
    default:
      return assertNever(s); // error here if there are missing cases
  }
}
```

## 数组

```ts
/** 字符串数组 */
let names: Array<string>;

/** 存放数字的数组 */
let nums: Array<number>;

/** 数组中各元素类型不确定 */
let data: Array<any>;

/** 字符串数组 */
let names: string[];

/** 存放数字的数组 */
let nums: number[];

/** 数组中各元素类型不确定 */
let data: any[];

// 当数组中元数个数有限且提前知晓每个位置的类型时，可将这种数据声明成元组Tuple
let point: [number, number] = [7, 5];
let formValidateResult: [booelan, string] = [false, "请输入用户名"];
```

## Enum

```ts
// 默认从0开始
enum Gender {
    Male,
    Female
}
console.log(Gender.Female===1); // true

// 修改枚举起始值
enum Gender {
  Male = 1,
  Female
}
console.log(Gender.Female); // 2

// 如果不是数字，需要全部手动赋值
enum Gender {
  Male = "male",
  Female // 这里必须赋值，不然要报错
}

// 枚举中的值也不一定都得是同一类型
enum Gender {
  Male = "male",
  Female = 2 // ✅also ojbk
}
console.log(Gender.Female); // 2
```

## 函数类型

```ts
(num: number) => string;

interface Calculator {
  name: string;
  calculate: (x: number, y: number) => number;
}

class Computer implements Calculator {
  constructor(public name: string) {}
  calculate(x: number, y: number) {
    return x + y;
  }
}

const counter: Calculator = {
  name: "counter",
  calculate: (x: number, y: number) => {
    return x - y;
  }
};
```

## interface 与 type
`interface`或`type`均可定义组合的复杂类型
```ts
type Role = "manager" | "employee";

interface Person {
  name: string;
  age: number;
  role: Role;
}
```
`type`又叫`type alias`
```ts
type Name = string;
type NameResolver = () => string;
type NameOrResolver = Name | NameResolver;
function getName(n: NameOrResolver): Name {
  if (typeof n === "string") {
    return n;
  } else {
    return n();
  }
}
```

## 交叉类型与联合类型

交叉类型是通过`&`操作符创建的类型，表示新的类型为参与操作的这些类型的并集。它实际上是将多个类型进行合并，而不是像其名称那样取交集
```ts
interface Student {
  id: string;
  age: number;
}

interface Employee {
  companyId: string;
}

type SocialMan = Student & Employee;

let tom: SocialMan;

tom.age = 5;
tom.companyId = "CID5241";
tom.id = "ID3241";
```

联合类型`Union Types`正如创建这种类型所使用的操作符 `|` 一样，他表示或的关系。新类型是个叠加态，在实际运行前，你不知道它到底所属哪种类型
```ts
function addOne(num: number | string):number {
  return Number(num) + 1
}

// 最佳实践中，建议你用联合字符串来代替枚举类型
type Role = "manager" | "employee";
```

## 类型断言

某些情况下，TypeScript 无法自动推断类型，此时可人工干预，对类型进行显式转换，我们称之为类型断言`Type assertions`

```ts
let someValue: any = "this is a string";

let strLength: number = (<string>someValue).length;

// 在React中尖括号会有问题，可以改成下面方式
let strLength: number = (someValue as string).length;

interface Person {
  name: string;
  gender: "male" | "female";
}

function sayName(person: Person) {
  console.log(person);
}

const tom = {
  name: "tom",
  gender: "male"
};

/** 🚨Type 'string' is not assignable to type '"male" | "female"' */
sayName(tom);

const tom = {
  name: "tom",
  gender: "male" as "male" | "female"
};

/** ✅ ok */
sayName(tom);
```
结合前面提到的类型别名，这里可以用 type 为性别创建一个别名类型，减少冗余。
```ts
 type Gender = "male" | "female";

interface Person {
  name: string;
  gender: Gender;
}

function sayName(person: Person) {
  console.log(person);
}

const tom = {
  name: "tom",
  gender: "male" as Gender
};


sayName(tom);
```

## 可选参数与可空字段

```ts
type Person = {
  name: string,
  age?: number // 可空
};
// 或者
type Person2 = {
  name: string,
  age: number | undefined
};

// 函数入参而言，入参加上问号后，可将入参标识为可选
// 可选的入参需要在参数列表中位于非可选的后面
function add(x: number, y?: number) {
  return x + (y || 1);
}
```

## TypeScript方法重载
比如有一个获取聊天消息的方法，根据传入的参数从数组中查找数据。如果入参为数字，则认为是 id，然后从数据源中找对应 id 的数据并返回，否则当成类型，返回这一类型的消息
```js
function getMessage(query) {
  if (typeof query === "number") {
    return data.find(message => message.id === query);
  } else {
    return data.filter(message => message.type === query);
  }
}
```

```ts
// 定义消息数据结构
type MessageType = "string" | "image" | "audio";

type Message = {
  id: number;
  type: MessageType;
  content: string;
};

// 获取数据方法
function getMessage(
  query: number | MessageType
): Message[] | Message | undefined {
  if (typeof query === "number") {
    return data.find(message => message.id === query);
  } else {
    return data.filter(message => message.type === query);
  }
}
```
这样做一是类型书写上比较丑陋，二是没有发挥出`TypeScript`类型检查的优势，这里我们是可以根据入参的类型明确知道返回的类型的，即如果传入的是id，返回的是`单个数据或undefined`，如果是根据类型查找，返回的是数组。而现在调用方法后，得到的类型太过宽泛，这和使用`any`做为返回没多大差别
```ts
// 因为类型的不明朗，返回的结果都不能直接操作，需要进行类型转换后才能继续

const result1 = getMessage("audio");
/** 不能直接对 result1 调用数组方法 */
console.log((result1 as Message[]).length);

const result2 = getMessage(1);
if (result2) {
  /** 不能对 result2 直接访问消息对象中的属性 */
  console.log((result2 as Message).content);
}
```

## 重载的实现

通过提供多个函数类型的声明来解决上面的问题，最后得到的结果就是间接实现了函数的重载
```ts
function getMessage(id: number): Message | undefined;
function getMessage(type: MessageType): Message[];
function getMessage(query: any): any {
  if (typeof query === "number") {
    return data.find(message => message.id === query);
  } else {
    return data.filter(message => message.type === query);
  }
}

// 对结果进行使用时，无须再进行类型转换

const result1 = getMessage("audio");
/** ✅ 无须类型转换 */
console.log(result1.length);

const result2 = getMessage(1);
if (result2) {
  /** ✅ 无须类型转换 */
  console.log(result2.content);
}
```

## 可选参数

```ts
function getMessage(id: number): Message | undefined;
function getMessage(type: MessageType, count?: number): Message[];
function getMessage(query: any, count = 10): any {
  if (typeof query === "number") {
    return data.find(message => message.id === query);
  } else {
    return data.filter(message => message.type === query).splice(0, count);
  }
}

// 这么调用就会报错，因为通过重载，2个参数的方法调用的是`type：MessageType`参数的方法，类型不匹配
getMessage(1,10);
```

TypeScript 重载的过程是，拿传入的参数和重载的方法签名列表中由上往下逐个匹配，直到找到一个完全匹配的函数签名，否则报错。所以推荐的做法是将签名更加具体的重载放上面，不那么具体的放后面
```ts
/** ✅*/
function getMessage(type: MessageType, count?: number): Message[];
function getMessage(id: number): Message | undefined;

/** 🚨*/
function getMessage(id: number): Message | undefined;
function getMessage(type: MessageType, count?: number): Message[];
```
像上面示例中正确做法这样，如果说入参个数只有一个，那可以直接跳过第一个函数签名，无须做入参类型的判断

