# Go加密

## 非对称加密

非对称加密和对称加密不同，主要区别如下

* 使用公钥加密，使用私钥解密
* 公钥和私钥不同
* 公钥可以公布给所有人
* 私钥只有自己保存
* 相比于对称加密，运算速度非常慢

加密过程：明文+公钥——>密文 解密过程：密文+私钥——>明文

非对称加密算法常用于数据加密和身份认证, 常见的非对称加密算法如下

* RSA: 由 RSA 公司发明，是一个支持变长密钥的公共密钥算法，需要加密的文件块的长度也是可变的，被ISO推荐为公钥数据加密标准。密钥越长，越难破解。1024位的RSA密钥基本安全，2048位的密钥极其安全。
* DSA(Digital Signature Algorithm): 数字签名算法，是一种标准的DSS(数字签名标准)
* ECC(Elliptic Curves Cryptography): 椭圆曲线密码编码学,ECC可以使用更短的密钥，来实现与RSA相当或更高的安全,处理速度快,存储空间占用小,带宽要求低。
* ECDSA(Elliptic Curve Digital Signature Algorithm): 基于椭圆曲线的DSA签名算法，在数字签名的安全性高, 基于ECC的DSA更高, 所以非常适合数字签名使用场景。

### RSA

加密过程：

1. 随机选择两个不相等的质数`p`和`q`，p=61，q=53
1. 计算`p`和`q`的乘积，`n=3233`
1. 计算n的欧拉函数 `∅(n) = (p-1)(q-1)，∅(n)=3120`
1. 随机选择一个整数`e`，使得 `1<e<∅(n)`，且`e`与`∅(n)`互质，e=17
1. 计算`e`对于`∅(n)`的模反元素 `d`，即求解` e*d + ∅(n)*y =1`，d=2753，y=-15
1. 将`n`和`e`封装成公钥，`n`和`d`封装成私钥，公钥=(3233, 17)，私钥=(3233, 2753)

示例代码:

```go
package encrypt

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha1"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"io/ioutil"
	"os"
)

var privite_key_path = "./encrypt/private.pem"
var public_key_path = "./encrypt/public.pem"

// 生成私钥
func generatePrivate() *rsa.PrivateKey {

	privateKey, error := rsa.GenerateKey(rand.Reader, 2048)
	if error != nil {
		fmt.Println(error)
	}
	derStream := x509.MarshalPKCS1PrivateKey(privateKey)
	block := &pem.Block{Type: "RSA PRIVATE KEY", Bytes: derStream}

	file, error := os.Create(privite_key_path)
	if error != nil {
		fmt.Println(error)
	}
	error = pem.Encode(file, block)
	if error != nil {
		fmt.Println(error)
	}
	return privateKey
}

// 生成公钥
func generatePublick(privateKey *rsa.PrivateKey) {
	publicKey := privateKey.Public()
	derStream, error := x509.MarshalPKIXPublicKey(publicKey)
	if error != nil {
		fmt.Println(error)
	}
	block := &pem.Block{Type: "RSA PUBLIC KEY", Bytes: derStream}
	file, error := os.Create(public_key_path)
	if error != nil {
		fmt.Println(error)
	}
	error = pem.Encode(file, block)
	if error != nil {
		fmt.Println(error)
	}
}

// 使用对方的公钥的数据, 只有对方的私钥才能解开
func encrypt(plain string) (cipherByte []byte, err error) {
	msg := []byte(plain)
	// 从文件中读取公钥编码字节流
	file, error := os.Open(public_key_path)
	if error != nil {
		fmt.Println(error)
	}
	publicKey, error := ioutil.ReadAll(file)
	// 解码公钥
	pubBlock, _ := pem.Decode(publicKey)
	// 读取公钥
	pubKeyValue, err := x509.ParsePKIXPublicKey(pubBlock.Bytes)
	if err != nil {
		panic(err)
	}
	pub := pubKeyValue.(*rsa.PublicKey)
	// 加密数据方法: 不用使用EncryptPKCS1v15方法加密,源码里面推荐使用EncryptOAEP, 因此这里使用安全的方法加密
	encryptOAEP, err := rsa.EncryptOAEP(sha1.New(), rand.Reader, pub, msg, nil)
	if err != nil {
		panic(err)
	}
	cipherByte = encryptOAEP
	return
}

// 使用私钥解密公钥加密的数据
func decrypt(cipherByte []byte) (plainText string, err error) {
	// 从文件中读取私钥pem字节流
	file, error := os.Open(privite_key_path)
	if error != nil {
		fmt.Println(error)
	}
	privateKey, error := ioutil.ReadAll(file)
	if error != nil {
		fmt.Println(error)
	}
	// 解析出私钥
	priBlock, _ := pem.Decode(privateKey)
	priKey, err := x509.ParsePKCS1PrivateKey(priBlock.Bytes)
	if err != nil {
		panic(err)
	}
	// 解密RSA-OAEP方式加密后的内容
	decryptOAEP, err := rsa.DecryptOAEP(sha1.New(), rand.Reader, priKey, cipherByte, nil)
	if err != nil {
		panic(err)
	}
	plainText = string(decryptOAEP)
	return
}
func Test() {
	// 生成公钥和私钥
	generatePublick(generatePrivate())

	msg := "Content bo be encrypted!"
	cipherData, err := encrypt(msg)
	if err != nil {
		panic(err)
	}
	fmt.Printf("encrypt message: %x\n", cipherData)
	plainData, err := decrypt(cipherData)
	if err != nil {
		panic(err)
	}
	fmt.Printf("decrypt message:%s\n", plainData)
}
```

### ECDSA

在golang的`ssh`库中就是使用这个算法来签名的：`A`使用自己的私钥签名一段数据，然后将公钥发放出去。用户拿到公钥后，验证数据的签名,如果通过则证明数据来源是`A`，从而达到身份认证的作用.

```go
package encrypt

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/md5"
	"crypto/rand"
	"fmt"
	"hash"
	"io"
	"math/big"
)

// SignData 用于保存签名的数据
type SignData struct {
	r         *big.Int
	s         *big.Int
	signhash  *[]byte
	signature *[]byte
}

// 使用私钥签名一段数据
func sign(message string, privateKey *ecdsa.PrivateKey) (signData *SignData, err error) {
	// 签名数据
	var h hash.Hash
	h = md5.New()
	r := big.NewInt(0)
	s := big.NewInt(0)
	io.WriteString(h, message)
	signhash := h.Sum(nil)
	r, s, serr := ecdsa.Sign(rand.Reader, privateKey, signhash)
	if serr != nil {
		return nil, serr
	}
	signature := r.Bytes()
	signature = append(signature, s.Bytes()...)
	signData = &SignData{
		r:         r,
		s:         s,
		signhash:  &signhash,
		signature: &signature,
	}
	return
}

// 校验数字签名
func verifySign(signData *SignData, publicKey *ecdsa.PublicKey) (status bool) {
	status = ecdsa.Verify(publicKey, *signData.signhash, signData.r, signData.s)
	return
}
func TestECDSA() {
	//使用椭圆曲线的P256算法,现在一共也就实现了4种,我们使用折中一种,具体见http://golang.org/pkg/crypto/elliptic/#P256
	pubkeyCurve := elliptic.P256()
	privateKey := new(ecdsa.PrivateKey)
	// 生成秘钥对
	privateKey, err := ecdsa.GenerateKey(pubkeyCurve, rand.Reader)
	if err != nil {
		panic(err)
	}
	var publicKey ecdsa.PublicKey
	publicKey = privateKey.PublicKey
	// 签名
	signData, err := sign("This is a message to be signed and verified by ECDSA!", privateKey)
	if err != nil {
		panic(err)
	}
	fmt.Printf("The signhash: %x\nThe signature: %x\n", *signData.signhash, *signData.signature)
	// 验证
	status := verifySign(signData, &publicKey)
	fmt.Printf("The verify result is: %v\n", status)
}
```