# Object克隆方法解析

克隆: 创建并返回此对象的一个副本——按照原对象，创建一个新的对象（复制原对象的内容）。

克隆出来的对象虽然不一致，但是底层的成员(引用类型)变量的哈希值是一致的，属于`浅表复制`。

`clone`创建对象一般在线程池、数据库连接池、具有固定数量类型的对象使用比较多，使用的是 `原型模式+工厂模式` 实现。

## 为什么要 clone 创建对象

因为通过 new 或者 反射 的方式有时候创建对象比较复杂，需要消耗比较多的资源。

通过使用clone方法，大大的减少了创建重复对象代码。这也就是clone方法存在的意义。

## 使用clone方法创建对象

Object的clone方法使用步骤：
  1. 在需要调用clone方法的对象上添加实现Cloneable接口
  1. 复写clone方法，在自己的clone方法中调用父类的clone方法，将返回值类型强转成本类类型，将当前clone方法修饰符改成public
  1. 调用对象的clone方法

```java
public class Person implements Cloneable{
    private String name;
    private int age;

	//....省略get/set/toString方法
	
    @Override
    public Person clone() throws CloneNotSupportedException {
        return (Person) super.clone();
    }
}

public class Test {
    public static void main(String[] args) throws Exception {
        Person p1 = new Person();
        p1.setName("张三");
        p1.setAge(18);
        Person p2 = p1.clone();
        System.out.println(p1+":"+p1.hashCode());
        System.out.println(p2+":"+p2.hashCode());
    }
}
//控制台打印结果：
Person{name='张三', age=18}:1908153060
Person{name='张三', age=18}:116211441
```

克隆出来的对象和原来的对象有什么关系：

我们已经知道了，克隆出来的对象内容一致，但是对象哈希值不同，所以是不同对象。

那么两个对象的内容之间有什么关联呢——两个对象的内容是彼此独立，还是，两个对象底层使用的同一个内容呢？

```java
public class Person implements Cloneable{
    private String name;
    private Integer age;
    private Children child;

	//....省略get/set/toString方法

    @Override
    public Person clone() throws CloneNotSupportedException {
        return (Person) super.clone();
    }
}

public class Children {
    private String name;
    private Integer age;

	//....省略get/set/toString方法
}

public class Test {
    public static void main(String[] args) throws Exception {
        Person p1 = new Person();
        p1.setName("张三");
        p1.setAge(28);
        Children children1 = new Children();
        children1.setName("张伟");
        children1.setAge(5);
        p1.setChild(children1);
        Person p2 = p1.clone();
        System.out.println(p1+":对象的哈希值："+p1.hashCode()+":child成员变量的哈希值："+p1.getChild().hashCode());
        System.out.println(p2+":对象的哈希值："+p2.hashCode()+":child成员变量的哈希值："+p2.getChild().hashCode());
    }
}
//控制台打印结果
Person{name='张三', age=28, child=Children{name='张伟', age=5}}:
对象的哈希值：116211441:child成员变量的哈希值：607635164
Person{name='张三', age=28, child=Children{name='张伟', age=5}}:
对象的哈希值：529116035:child成员变量的哈希值：607635164
```

结论：通过测试发现克隆出来的对象虽然不一致，但是底层的成员变量的哈希值是一致的。

这种复制我们称之为：浅表复制。

* **浅表复制的弊端**：

由于浅表复制导致克隆的对象中成员变量的底层哈希值一致，如果我们操作其中一个对象的成员变量内容，就会导致，所有的克隆对象的成员内容发送改变。

结论：clone方法默认的复制操作是浅表复制，浅表复制存在弊端——仅仅创建新的对象，对象的成员内容底层哈希值是一致的，因此，不管是原对象还是克隆对象，只有其中一个修改了成员的数据，就会影响所有的原对象和克隆对象。

要解决浅表复制的问题：进行深层的复制。

## 深层复制

目的：不仅在执行克隆的时候，克隆对象是一个新对象，而且，克隆对象中的成员变量，也要求是一个新的对象


开发步骤：

1. 修改children类实现Cloneable接口；
1. 修改children类重写clone方法；
1. 修改Person类重写clone方法，在clone方法中调用children的clone方法；

```java
public class Children implements Cloneable {
    private String name;
    private Integer age;

	//....省略get/set/toString方法

    @Override
    public Children clone() throws CloneNotSupportedException {
        return (Children) super.clone();
    }
}

public class Person implements Cloneable{
    private String name;
    private Integer age;
    private Children child;

	//....省略get/set/toString方法

    @Override
    public Person clone() throws CloneNotSupportedException {
        Person clone = (Person) super.clone();
        clone.setChild(child.clone());
        return clone;
    }
}

public class Test {
    public static void main(String[] args) throws Exception {
        Person p1 = new Person();
        p1.setName("张三");
        p1.setAge(28);

        Children children1 = new Children();
        children1.setName("张伟");
        children1.setAge(5);
        p1.setChild(children1);

        Person p2 = p1.clone();

        System.out.println(p1.getChild());
        System.out.println(p2.getChild());

        children1.setName("张三丰");
        System.out.println(p1.getChild());
        System.out.println(p2.getChild());

        Children children2 = p2.getChild();
        children2.setName("张无忌");
        System.out.println(p1.getChild());
        System.out.println(p2.getChild());

        System.out.println(p1.getChild().hashCode());
        System.out.println(p2.getChild().hashCode());
    }
}
//控制台打印结果
Children{name='张伟', age=5}
Children{name='张伟', age=5}
Children{name='张三丰', age=5}
Children{name='张伟', age=5}
Children{name='张三丰', age=5}
Children{name='张无忌', age=5}
116211441
607635164
```

可以看到，深层复制成员变量如果是对象，那么也会创建新的对象。

使用clone接口实现深层复制的弊端：

虽然深度复制成员变量对象也是创建新的对象，但是修改类中成员变量对应的源码，如果成员变量特别多，那么就需要修改多个类的源码；

比如：前面的Person类中现在又新增了Son、Sister、Mother啥全家福的，那对应需要修改的类就特别多了；

## 使用IO进行克隆复制

深层复制—克隆涉及的所有的类实现Serializable接口

开发步骤：

1. 创建ByteArrayOutputStream，将数据可以转换成字节；
1. 创建ObjectOutputStream，关联ByteArrayOutputStream；
1. 使用ObjectOutputStream的writeObject，读取要复制的对象；
1. 使用ByteArrayInputStream读取ByteArrayOutputStream的转换的对象字节数据；
1. 创建ObjectInputStream读取对象字节数据，创建新的对象；

```java

import java.io.Serializable;

public class User implements Serializable {

    private String name;
    private int age;
	
	//省略get/set/toString方法
}


import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;

public class Test {
    public static void main(String[] args) throws Exception {
        User user = new User();
        user.setName("李四");
        user.setAge(18);
        //1. 创建ByteArrayOutputStream，将数据可以转换成字节
        ByteArrayOutputStream bout = new ByteArrayOutputStream();
        //2. 创建ObjectOutputStream，关联ByteArrayOutputStream
        ObjectOutputStream out = new ObjectOutputStream(bout);
        //3. 使用ObjectOutputStream的writeObject，读取要复制的对象
        out.writeObject(user);
        //4. 使用ByteArrayInputStream读取ByteArrayOutputStream的转换的对象字节数据
        ByteArrayInputStream bin = new ByteArrayInputStream(bout.toByteArray());
        //5. 创建ObjectInputStream读取对象字节数据，创建新的对象
        ObjectInputStream in =  new ObjectInputStream(bin);
        User obj = (User) in.readObject();
        System.out.println(user+":"+user.hashCode());
        System.out.println(obj + ":" + obj.hashCode());
    }
}
//控制台打印结果
User{name='李四', age=18}:2080166188
User{name='李四', age=18}:1626877848
```

### 使用IO改写Person的clone方法

开发步骤：

1. 克隆涉及的所有的类实现Serializable接口；
1. 修改Person类的clone方法，使用IO复制对象；

```java

@Override
public Person clone() {
    try {
        //1. 创建ByteArrayOutputStream，将数据可以转换成字节
        ByteArrayOutputStream bout = new ByteArrayOutputStream();
        //2. 创建ObjectOutputStream，关联ByteArrayOutputStream
        ObjectOutputStream out = new ObjectOutputStream(bout);
        //3. 使用ObjectOutputStream的writeObject，读取要复制的对象
        out.writeObject(this);
        //4. 使用ByteArrayInputStream读取ByteArrayOutputStream的转换的对象字节数据
        ByteArrayInputStream bin = new ByteArrayInputStream(bout.toByteArray());
        //5. 创建ObjectInputStream读取对象字节数据，创建新的对象
        ObjectInputStream in = new ObjectInputStream(bin);
        Person clone = (Person) in.readObject();
        return clone;
    } catch (Exception e) {
        e.printStackTrace();
        return null;
    }
}


public class Test {
    public static void main(String[] args) throws Exception {
        Person p1 = new Person();
        p1.setName("张三");
        p1.setAge(58);
        Children children1 = new Children();
        children1.setName("张伟");
        children1.setAge(25);
        p1.setChild(children1);
        Person p2 = p1.clone();
        System.out.println(p1.getChild()+":"+p1.getChild().hashCode());
        System.out.println(p2.getChild()+":"+p2.getChild().hashCode());
    }
}
//控制台打印
Children{name='张伟', age=25}:1846274136
Children{name='张伟', age=25}:284720968
```

