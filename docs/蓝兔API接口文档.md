# 蓝兔支付API接口文档

## 1.签名算法

###### 签名生成的通用步骤如下：

1. 设所有发送或者接收到的数据为集合M，将集合M内非空参数值的参数按照参数名ASCII码从小到大排序（字典序），使用URL键值对的格式（即key1=value1&key2=value2…）拼接成字符串stringA。
2. 在stringA最后拼接上 &key=密钥 得到stringSignTemp字符串，并对stringSignTemp进行MD5运算，再将得到的字符串所有字符转换为大写，得到sign值。

注意：只有必填参数才参与签名！！！

注意：只有必填参数才参与签名！！！

注意：只有必填参数才参与签名！！！

温馨提示：蓝兔支付签名算法与微信支付V2签名算法一致，签名校验工具 [>>点击此处](https://pay.weixin.qq.com/wiki/doc/api/app/app.php?chapter=20_1)。

###### JS示例代码：

```javascript
function wxPaySign(params, key) {
    const paramsArr = Object.keys(params);
    paramsArr.sort();
    const stringArr = [];
    paramsArr.map(key => {
        stringArr.push(key + '=' + params[key]);
    });
    // 最后加上商户Key
    stringArr.push("key=" + key);
    const string = stringArr.join('&');
    return md5(string).toString().toUpperCase();
}
```

###### 

###### JAVA示例代码：

```java
public static String packageSign(Map < String, String > params, boolean urlEncoder) {
    // 先将参数以其参数名的字典序升序进行排序
    TreeMap < String, String > sortedParams = new TreeMap < String, String > (params);
    // 遍历排序后的字典，将所有参数按"key=value"格式拼接在一起
    StringBuilder sb = new StringBuilder();
    boolean first = true;
    for (Entry < String, String > param: sortedParams.entrySet()) {
        String value = param.getValue();
        if (StrKit.isBlank(value)) {
            continue;
        }
        if (first) {
            first = false;
        } else {
            sb.append("&");
        }
        sb.append(param.getKey()).append("=");
        if (urlEncoder) {
            try {
                value = urlEncode(value);
            } catch (UnsupportedEncodingException e) {}
        }
        sb.append(value);
    }
    return sb.toString();
}

public static String urlEncode(String src) throws UnsupportedEncodingException {
    return URLEncoder.encode(src, Charsets.UTF_8.name()).replace("+", "%20");
}

public static String createSign(Map < String, String > params, String partnerKey) {
    // 生成签名前先去除sign
    params.remove("sign");
    String stringA = packageSign(params, false);
    String stringSignTemp = stringA + "&key=" + partnerKey;
    return md5(stringSignTemp).toUpperCase();
}
```



## 2.支付通知API

###### 蓝兔支付通过支付通知接口将用户支付成功消息通知给商户

**注意：**

- 同样的通知可能会多次发送给商户系统。商户系统必须能够正确处理重复的通知。 推荐的做法是，当商户系统收到通知进行处理时，先检查对应业务数据的状态，并判断该通知是否已经处理。如果未处理，则再进行处理；如果已处理，则直接返回结果成功。在对业务数据进行状态检查和处理之前，要采用数据锁进行并发控制，以避免函数重入造成的数据混乱。
- 如果在所有通知频率后没有收到蓝兔支付侧回调，商户应调用查询订单接口确认订单状态。

**特别提醒：**商户系统对于开启结果通知的内容一定要做签名验证，并校验通知的信息是否与商户侧的信息一致，防止数据泄露导致出现“假通知”，造成资金损失。

------

###### 接口说明

**适用对象：**个人、个体户、企业

**请求方式：**POST

**回调URL：**该链接是通过支付接口中的请求参数“notify_url”来设置的，要求必须为http或https地址。请确保回调URL是外部可正常访问的，且不能携带后缀参数，否则可能导致商户无法接收到蓝兔支付的回调通知信息。回调URL示例：“https://pay.weixin.qq.com/wxpay/pay.action”

###### 通知规则

用户支付完成后，蓝兔支付会把相关支付结果和用户信息发送给商户，商户需要接收处理该消息，并返回应答。

对后台通知交互时，如果蓝兔支付收到商户的应答不符合规范或超时，蓝兔支付认为通知失败，蓝兔支付会通过一定的策略定期重新发起通知，尽可能提高通知的成功率，但蓝兔支付不保证通知最终能成功。（通知频率为15s/15s/30s/3m/10m/20m/30m/30m/30m/60m/3h/3h/3h/6h/6h - 总计 24h4m）

###### 通知参数

| 参数名       | 参数类型 | 是否参与签名 | 描述                                                         |
| ------------ | -------- | ------------ | ------------------------------------------------------------ |
| code         | String   | 是           | 支付结果，枚举值： 0：成功 1：失败 示例值：0                 |
| timestamp    | String   | 是           | 时间戳 示例值：1669518774                                    |
| mch_id       | String   | 是           | 商户号 示例值：1230000109                                    |
| order_no     | String   | 是           | 系统订单号 示例值：WX202211221155084844072633                |
| out_trade_no | String   | 是           | 商户订单号 示例值：LTZF2022112264463                         |
| pay_no       | String   | 是           | 支付宝或微信支付订单号 示例值：4200001635202211222291508463  |
| total_fee    | String   | 是           | 支付金额 示例值：0.01                                        |
| sign         | String   | 否           | 签名，签名验证的算法请参考[《签名算法》](https://www.ltzf.cn/doc#collapse_sign)。 示例值：575225E549B2FBB82FB23505263633CD |
| pay_channel  | String   | 否           | 支付渠道，枚举值： alipay：支付宝 wxpay：微信支付 示例值：wxpay |
| trade_type   | String   | 否           | 支付类型，枚举值： NATIVE：扫码支付 H5：H5支付 APP：APP支付 JSAPI：公众号支付 MINIPROGRAM：小程序支付 示例值：NATIVE |
| success_time | String   | 否           | 支付完成时间 示例值：2022-11-22 11:55:42                     |
| attach       | String   | 否           | 附加数据，在支付接口中填写的数据，可作为自定义参数使用。 示例值：自定义数据 |
| openid       | String   | 否           | 支付者信息 示例值：o5wq46GAKVxVKpsdcI4aU4cBpgT0              |

###### 通知应答

**接收成功：**HTTP应答状态码需返回200，同时应答报文需返回：SUCCESS，必须为大写。

**接收失败：**应答报文返回：FAIL。



## 3.退款通知API

###### 蓝兔支付通过退款通知接口将退款成功消息通知给商户

**注意：**

- 同样的通知可能会多次发送给商户系统。商户系统必须能够正确处理重复的通知。 推荐的做法是，当商户系统收到通知进行处理时，先检查对应业务数据的状态，并判断该通知是否已经处理。如果未处理，则再进行处理；如果已处理，则直接返回结果成功。在对业务数据进行状态检查和处理之前，要采用数据锁进行并发控制，以避免函数重入造成的数据混乱。
- 如果在所有通知频率后没有收到蓝兔支付侧回调，商户应调用查询退款结果接口确认退款状态。

**特别提醒：**商户系统对于开启结果通知的内容一定要做签名验证，并校验通知的信息是否与商户侧的信息一致，防止数据泄露导致出现“假通知”，造成资金损失。

------

###### 接口说明

**适用对象：**个人、个体户、企业

**请求方式：**POST

**回调URL：**该链接是通过订单退款接口中的请求参数“notify_url”来设置的，要求必须为http或https地址。请确保回调URL是外部可正常访问的，且不能携带后缀参数，否则可能导致商户无法接收到蓝兔支付的回调通知信息。回调URL示例：“https://pay.weixin.qq.com/wxpay/pay.action”

###### 通知规则

退款完成后，蓝兔支付会把相关退款结果发送给商户，商户需要接收处理该消息，并返回应答。

对后台通知交互时，如果蓝兔支付收到商户的应答不符合规范或超时，蓝兔支付认为通知失败，蓝兔支付会通过一定的策略定期重新发起通知，尽可能提高通知的成功率，但蓝兔支付不保证通知最终能成功。（通知频率为15s/15s/30s/3m/10m/20m/30m/30m/30m/60m/3h/3h/3h/6h/6h - 总计 24h4m）

###### 通知参数

| 参数名        | 参数类型 | 是否参与签名 | 描述                                                         |
| ------------- | -------- | ------------ | ------------------------------------------------------------ |
| code          | String   | 是           | 支付结果，枚举值： 0：成功 1：失败 示例值：0                 |
| timestamp     | String   | 是           | 时间戳 示例值：1669809319                                    |
| mch_id        | String   | 是           | 商户号 示例值：1230000109                                    |
| order_no      | String   | 是           | 系统订单号 示例值：WX202211301535506173701342                |
| out_trade_no  | String   | 是           | 商户订单号 示例值：LTZF2022113023096                         |
| pay_no        | String   | 是           | 支付宝或微信支付订单号 示例值：4200001655202211302129710035  |
| refund_no     | String   | 是           | 系统退款单号 示例值：T02022113054995451                      |
| out_refund_no | String   | 是           | 商户退款单号 示例值：TK2022113058808                         |
| pay_channel   | String   | 是           | 退款渠道，枚举值： alipay：支付宝 wxpay：微信支付 示例值：wxpay |
| refund_fee    | String   | 是           | 退款金额 示例值：0.01                                        |
| sign          | String   | 否           | 签名，签名验证的算法请参考[《签名算法》](https://www.ltzf.cn/doc#collapse_sign)。 示例值：2C44F0D59E54320C2A6D4E3EB9CA909F |
| success_time  | String   | 否           | 退款完成时间 示例值：2022-11-30 19:47:58                     |

###### 通知应答

**接收成功：**HTTP应答状态码需返回200，同时应答报文需返回：SUCCESS，必须为大写。

**接收失败：**应答报文返回：FAIL。



## 4.扫码支付API

###### 蓝兔支付后台系统返回二维码地址和微信原生的支付链接，商户可自行使用原生链接生成二维码图片，用户使用微信客户端扫码后发起支付。

**注意：**

- 此接口不支持通过从相册识别二维码，如果需要通过相册识别二维码，请使用[《公众号支付便捷版》](https://www.ltzf.cn/doc#collapse_wxpay_jsapi_convenient)支付接口。

**特别提醒：**调用接口前请先在控制台微信支付商户管理修改设置白名单域名和白名单IP。

------

###### 接口说明

**适用对象：**个人、个体户、企业

**请求URL：**https://api.ltzf.cn/api/wxpay/native

**请求方式：**POST

###### 请求参数

| 参数名          | 参数类型 | 必填 | 描述                                                         |
| --------------- | -------- | ---- | ------------------------------------------------------------ |
| mch_id          | String   | 是   | 商户号 示例值：1230000109                                    |
| out_trade_no    | String   | 是   | 商户订单号，只能是数字、大小写字母_-且在同一个商户号下唯一。 示例值：LTZF2022113023096 |
| total_fee       | String   | 是   | 支付金额 示例值：0.01                                        |
| body            | String   | 是   | 商品描述 示例值：Image形象店-深圳腾大-QQ公仔                 |
| timestamp       | String   | 是   | 当前时间戳 示例值：1669533132                                |
| notify_url      | String   | 是   | 支付通知地址，通知URL必须为直接可访问的URL，不允许携带查询串，要求必须为http或https地址，回调通知参数请参考[《支付通知》](https://www.ltzf.cn/doc#collapse_pay_notify)。 示例值：https://www.weixin.qq.com/wxpay/pay.php |
| attach          | String   | 否   | 附加数据，在支付通知中原样返回，可作为自定义参数使用。 示例值：自定义数据 |
| time_expire     | String   | 否   | 订单失效时间，枚举值： m：分钟 h：小时 取值范围：1m～2h（接口请求后开始计算时间） 示例值：5m |
| developer_appid | String   | 否   | 开发者应用ID 示例值：1041589049015120                        |
| sign            | String   | 是   | 签名，数据签名的算法请参考[《签名算法》](https://www.ltzf.cn/doc#collapse_sign)。 示例值：B7337098E280841EB5F4D28261B60C07 |

**请求示例代码**（Java）

```java
HttpResponse<String> response = Unirest.post("https://api.ltzf.cn/api/wxpay/native")
  .header("content-type", "application/x-www-form-urlencoded")
  .body("mch_id=1230000109&out_trade_no=LTZF2022113023096&total_fee=0.01&body=Image形象店-深圳腾大-QQ公仔&timestamp=1669533132&notify_url=https://www.weixin.qq.com/wxpay/pay.php&attach=自定义数据&time_expire=5m&developer_appid=1041589049015120&sign=B7337098E280841EB5F4D28261B60C07")
  .asString();
```

###### 返回参数

成功参数

| 参数名          | 参数类型 | 必填 | 描述                                                         |
| --------------- | -------- | ---- | ------------------------------------------------------------ |
| code            | Integer  | 是   | 返回状态，枚举值： 0：成功 1：失败 示例值：0                 |
| data            | Object   | 是   | 返回数据                                                     |
| data.code_url   | String   | 是   | 微信原生支付链接，此URL用于生成支付二维码，然后提供给用户扫码支付。 示例值：weixin://wxpay/bizpayurl?pr=i8SfEeFzz |
| data.QRcode_url | String   | 是   | 蓝兔支付生成的二维码链接地址 示例值：https://api.ltzf.cn/uploads/QRcode/wxpay/1667888007846.png |
| msg             | String   | 是   | 消息 示例值：微信Native下单成功                              |
| request_id      | String   | 是   | 唯一请求ID，每次请求都会返回，定位问题时需要提供该次请求的request_id。 示例值：8fbbcb94-94f0-dcfa-3b25-892b45579b12 |

成功示例

```json
{
    "code": 0, 
    "data": {
        "code_url": "weixin://wxpay/bizpayurl?pr=i8SfEeFzz", 
        "QRcode_url": "https://api.ltzf.cn/uploads/QRcode/wxpay/1667888007846.png"
    }, 
    "msg": "微信Native下单成功", 
    "request_id": "8fbbcb94-94f0-dcfa-3b25-892b45579b12"
}
```

失败参数

| 参数名     | 参数类型 | 必填 | 描述                                                         |
| ---------- | -------- | ---- | ------------------------------------------------------------ |
| code       | Integer  | 是   | 返回状态，枚举值： 0：成功 1：失败 示例值：1                 |
| msg        | String   | 是   | 消息 示例值：签名错误                                        |
| request_id | String   | 是   | 唯一请求ID，每次请求都会返回，定位问题时需要提供该次请求的request_id。 示例值：d42ad311-989f-ba93-c8a6-f4520f6d8169 |

失败示例

```json
{
    "code": 1, 
    "msg": "签名错误", 
    "request_id": "d42ad311-989f-ba93-c8a6-f4520f6d8169"
}
```



**请求示例代码**（Javascript）：

```javascript
const data = "mch_id=1230000109&out_trade_no=LTZF2022113023096&total_fee=0.01&body=Image形象店-深圳腾大-QQ公仔&timestamp=1669533132&notify_url=https://www.weixin.qq.com/wxpay/pay.php&attach=自定义数据&time_expire=5m&developer_appid=1041589049015120&sign=B7337098E280841EB5F4D28261B60C07";

const xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener("readystatechange", function () {
  if (this.readyState === this.DONE) {
    console.log(this.responseText);
  }
});

xhr.open("POST", "https://api.ltzf.cn/api/wxpay/native");
xhr.setRequestHeader("content-type", "application/x-www-form-urlencoded");

xhr.send(data);
```

###### 返回参数

成功参数

| 参数名          | 参数类型 | 必填 | 描述                                                         |
| --------------- | -------- | ---- | ------------------------------------------------------------ |
| code            | Integer  | 是   | 返回状态，枚举值： 0：成功 1：失败 示例值：0                 |
| data            | Object   | 是   | 返回数据                                                     |
| data.code_url   | String   | 是   | 微信原生支付链接，此URL用于生成支付二维码，然后提供给用户扫码支付。 示例值：weixin://wxpay/bizpayurl?pr=i8SfEeFzz |
| data.QRcode_url | String   | 是   | 蓝兔支付生成的二维码链接地址 示例值：https://api.ltzf.cn/uploads/QRcode/wxpay/1667888007846.png |
| msg             | String   | 是   | 消息 示例值：微信Native下单成功                              |
| request_id      | String   | 是   | 唯一请求ID，每次请求都会返回，定位问题时需要提供该次请求的request_id。 示例值：8fbbcb94-94f0-dcfa-3b25-892b45579b12 |

成功示例

```json
{
    "code": 0, 
    "data": {
        "code_url": "weixin://wxpay/bizpayurl?pr=i8SfEeFzz", 
        "QRcode_url": "https://api.ltzf.cn/uploads/QRcode/wxpay/1667888007846.png"
    }, 
    "msg": "微信Native下单成功", 
    "request_id": "8fbbcb94-94f0-dcfa-3b25-892b45579b12"
}
```

失败参数

| 参数名     | 参数类型 | 必填 | 描述                                                         |
| ---------- | -------- | ---- | ------------------------------------------------------------ |
| code       | Integer  | 是   | 返回状态，枚举值： 0：成功 1：失败 示例值：1                 |
| msg        | String   | 是   | 消息 示例值：签名错误                                        |
| request_id | String   | 是   | 唯一请求ID，每次请求都会返回，定位问题时需要提供该次请求的request_id。 示例值：d42ad311-989f-ba93-c8a6-f4520f6d8169 |

失败示例

```json
{
    "code": 1, 
    "msg": "签名错误", 
    "request_id": "d42ad311-989f-ba93-c8a6-f4520f6d8169"
}
```



## 5.获取微信Openid API

###### 蓝兔支付返回授权链接。

**注意：**

- 此接口禁止业务未发生时调用，比如网站一打开就调用此接口，系统识别该种情况会拉黑服务器IP。

**特别提醒：**调用接口前请先在控制台微信支付商户管理修改设置白名单IP。

------

###### 接口说明

**适用对象：**个人、个体户、企业

**请求URL：**https://api.ltzf.cn/api/wxpay/get_wechat_openid

**请求方式：**POST

###### 请求参数

| 参数名       | 参数类型 | 必填 | 描述                                                         |
| ------------ | -------- | ---- | ------------------------------------------------------------ |
| mch_id       | String   | 是   | 商户号 示例值：1230000109                                    |
| timestamp    | String   | 是   | 当前时间戳 示例值：1669518774                                |
| callback_url | String   | 是   | 授权后重定向的回调链接地址 示例值：https://www.ltzf.cn/      |
| attach       | String   | 否   | 附加数据，回调时原样返回，可作为自定义参数使用。 示例值：自定义数据 |
| sign         | String   | 是   | 签名，数据签名的算法请参考[《签名算法》](https://www.ltzf.cn/doc#collapse_sign)。 示例值：04E635F91BE30725195E574826C01A46 |

请求示例代码（Java）：

```java
HttpResponse<String> response = Unirest.post("https://api.ltzf.cn/api/wxpay/get_wechat_openid")
  .header("content-type", "application/x-www-form-urlencoded")
  .body("mch_id=1230000109&timestamp=1669518774&callback_url=https://www.ltzf.cn/&attach=自定义数据&sign=04E635F91BE30725195E574826C01A46")
  .asString();
```

###### 返回参数

成功参数

| 参数名     | 参数类型 | 必填 | 描述                                                         |
| ---------- | -------- | ---- | ------------------------------------------------------------ |
| code       | Integer  | 是   | 返回状态，枚举值： 0：成功 1：失败 示例值：0                 |
| data       | String   | 是   | 授权链接，在微信里访问这个链接，访问后将自动跳转到您填写的回调地址，地址后面会增加openid和attach参数（例如：https://www.ltzf.cn/?openid=XXXXXX&attach=自定义数据） 示例值：https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxa3d61201263587a8&redirect_uri=https://api.ltzf.cn/api/wxpay/wx_oauth&response_type=code&scope=snsapi_base&state=AB23F31B5F0C863B344C8D59605B0809#wechat_redirect |
| msg        | String   | 是   | 消息 示例值：获取授权链接成功                                |
| request_id | String   | 是   | 唯一请求ID，每次请求都会返回，定位问题时需要提供该次请求的request_id。 示例值：3a08d731-f79b-9283-1a1a-24156707111e |

成功示例

```json
{
    "code": 0, 
    "data": "https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxa3d61201263587a8&redirect_uri=https://api.ltzf.cn/api/wxpay/wx_oauth&response_type=code&scope=snsapi_base&state=AB23F31B5F0C863B344C8D59605B0809#wechat_redirect", 
    "msg": "获取授权链接成功", 
    "request_id": "3a08d731-f79b-9283-1a1a-24156707111e"
}
```

失败参数

| 参数名     | 参数类型 | 必填 | 描述                                                         |
| ---------- | -------- | ---- | ------------------------------------------------------------ |
| code       | Integer  | 是   | 返回状态，枚举值： 0：成功 1：失败 示例值：1                 |
| msg        | String   | 是   | 消息 示例值：签名错误                                        |
| request_id | String   | 是   | 唯一请求ID，每次请求都会返回，定位问题时需要提供该次请求的request_id。 示例值：e5938d29-8ed4-98b1-d192-b50fcb4909de |

失败示例

```json
{
    "code": 1, 
    "msg": "签名错误", 
    "request_id": "e5938d29-8ed4-98b1-d192-b50fcb4909de"
}
```



## 6.查询订单API

###### 商户可以通过查询订单接口主动查询订单状态，完成下一步的业务逻辑。

**注意：**

- 此接口请求频率限制：1qps/5s，即5秒钟请求限制为1次。

**特别提醒：**调用接口前请先在控制台微信支付商户管理修改设置白名单IP。

------

###### 接口说明

**适用对象：**个人、个体户、企业

**请求URL：**https://api.ltzf.cn/api/wxpay/get_pay_order

**请求方式：**POST

###### 请求参数

| 参数名       | 参数类型 | 必填 | 描述                                                         |
| ------------ | -------- | ---- | ------------------------------------------------------------ |
| mch_id       | String   | 是   | 商户号 示例值：1230000109                                    |
| out_trade_no | String   | 是   | 商户订单号 示例值：LTZF2022112264463                         |
| timestamp    | String   | 是   | 当前时间戳 示例值：1669518774                                |
| sign         | String   | 是   | 签名，数据签名的算法请参考[《签名算法》](https://www.ltzf.cn/doc#collapse_sign)。 示例值：4440B462E792B604BD56A37EA41E5B8F |

请求示例代码（Java）:

```java
HttpResponse<String> response = Unirest.post("https://api.ltzf.cn/api/wxpay/get_pay_order")
  .header("content-type", "application/x-www-form-urlencoded")
  .body("mch_id=1230000109&out_trade_no=LTZF2022112264463&timestamp=1669518774&sign=4440B462E792B604BD56A37EA41E5B8F")
  .asString();
```

###### 返回参数

成功参数

| 参数名            | 参数类型 | 必填 | 描述                                                         |
| ----------------- | -------- | ---- | ------------------------------------------------------------ |
| code              | Integer  | 是   | 返回状态，枚举值： 0：成功 1：失败 示例值：0                 |
| data              | Object   | 是   | 返回数据                                                     |
| data.add_time     | String   | 是   | 下单时间 示例值：2022-11-22 11:55:09                         |
| data.mch_id       | String   | 是   | 商户号 示例值：1230000109                                    |
| data.order_no     | String   | 是   | 系统订单号 示例值：WX202211221155084844072633                |
| data.out_trade_no | String   | 是   | 商户订单号 示例值：LTZF2022112264463                         |
| data.pay_no       | String   | 否   | 微信支付订单号，当支付状态为已支付时返回此参数。 示例值：4200001635202211222291508463 |
| data.body         | String   | 是   | 商品描述 示例值：Image形象店-深圳腾大-QQ公仔                 |
| data.total_fee    | String   | 是   | 支付金额 示例值：0.01                                        |
| data.trade_type   | String   | 是   | 支付类型，枚举值： NATIVE：扫码支付 H5：H5支付 APP：APP支付 JSAPI：公众号支付 MINIPROGRAM：小程序支付 示例值：NATIVE |
| data.success_time | String   | 否   | 支付完成时间，当支付状态为已支付时返回此参数。 示例值：2022-11-22 11:55:42 |
| data.attach       | String   | 是   | 附加数据，在支付接口中填写的数据，可作为自定义参数使用。 示例值：自定义数据 |
| data.openid       | String   | 否   | 支付者信息，当支付状态为已支付时返回此参数。 示例值：o5wq46GAKVxVKpsdcI4aU4cBpgT0 |
| data.pay_status   | Integer  | 是   | 支付状态，枚举值： 0：未支付 1：已支付 示例值：1             |
| msg               | String   | 是   | 消息 示例值：查询成功                                        |
| request_id        | String   | 是   | 唯一请求ID，每次请求都会返回，定位问题时需要提供该次请求的request_id。 示例值：1bc65e47-77c3-b68a-c37c-b56a97d18d24 |

成功示例

```json
{
    "code": 0, 
    "data": {
        "add_time": "2022-11-22 11:55:09", 
        "mch_id": "1230000109", 
        "order_no": "WX202211221155084844072633", 
        "out_trade_no": "LTZF2022112264463", 
        "pay_no": "4200001635202211222291508463", 
        "body": "Image形象店-深圳腾大-QQ公仔", 
        "total_fee": "0.01", 
        "trade_type": "NATIVE", 
        "success_time": "2022-11-22 11:55:42", 
        "attach": "自定义数据", 
        "openid": "o5wq46GAKVxVKpsdcI4aU4cBpgT0", 
        "pay_status": 1
    }, 
    "msg": "查询成功", 
    "request_id": "1bc65e47-77c3-b68a-c37c-b56a97d18d24"
}
```

失败参数

| 参数名     | 参数类型 | 必填 | 描述                                                         |
| ---------- | -------- | ---- | ------------------------------------------------------------ |
| code       | Integer  | 是   | 返回状态，枚举值： 0：成功 1：失败 示例值：1                 |
| msg        | String   | 是   | 消息 示例值：商户订单号不存在                                |
| request_id | String   | 是   | 唯一请求ID，每次请求都会返回，定位问题时需要提供该次请求的request_id。 示例值：f46b1932-7f95-b728-7e0c-17663f7a3c7e |

失败示例

```json
{
    "code": 1, 
    "msg": "商户订单号不存在", 
    "request_id": "f46b1932-7f95-b728-7e0c-17663f7a3c7e"
}
```



## 7.查询退款结果API

###### 提交退款申请后，通过调用该接口查询退款状态。退款有一定延时，建议在提交退款申请后1分钟发起查询退款状态，一般来说零钱支付的退款5分钟内到账，银行卡支付的退款1-3个工作日到账。

**注意：**

- 此接口请求频率限制：1qps/10s，即10秒钟请求限制为1次。

**特别提醒：**调用接口前请先在控制台微信支付商户管理修改设置白名单IP。

------

###### 接口说明

**适用对象：**个人、个体户、企业

**请求URL：**https://api.ltzf.cn/api/wxpay/get_refund_order

**请求方式：**POST

###### 请求参数

| 参数名        | 参数类型 | 必填 | 描述                                                         |
| ------------- | -------- | ---- | ------------------------------------------------------------ |
| mch_id        | String   | 是   | 商户号 示例值：1230000109                                    |
| out_refund_no | String   | 是   | 商户退款单号 示例值：TK2022112294916                         |
| timestamp     | String   | 是   | 当前时间戳 示例值：1669518774                                |
| sign          | String   | 是   | 签名，数据签名的算法请参考[《签名算法》](https://www.ltzf.cn/doc#collapse_sign)。 示例值：682B13F8D7305CDBC70E22721604D14B |

请求示例代码(Java):

```java
HttpResponse<String> response = Unirest.post("https://api.ltzf.cn/api/wxpay/get_refund_order")
  .header("content-type", "application/x-www-form-urlencoded")
  .body("mch_id=1230000109&out_refund_no=TK2022112294916&timestamp=1669518774&sign=682B13F8D7305CDBC70E22721604D14B")
  .asString();
```

###### 返回参数

成功参数

| 参数名                     | 参数类型 | 必填 | 描述                                                         |
| -------------------------- | -------- | ---- | ------------------------------------------------------------ |
| code                       | Integer  | 是   | 返回状态，枚举值： 0：成功 1：失败 示例值：0                 |
| data                       | Object   | 是   | 返回数据                                                     |
| data.refund_status         | Integer  | 是   | 退款状态，枚举值： 0：退款中 1：退款成功 -1：退款失败 示例值：1 |
| data.mch_id                | String   | 是   | 商户号 示例值：1230000109                                    |
| data.out_trade_no          | String   | 是   | 商户订单号 示例值：ltzf1667389556                            |
| data.pay_no                | String   | 是   | 微信支付订单号 示例值：4200001667202211023770698203          |
| data.order_no              | String   | 是   | 系统退款单号 示例值：T0202211221235592690754030              |
| data.out_refund_no         | String   | 是   | 商户退款单号 示例值：TK2022112294916                         |
| data.pay_refund_no         | String   | 是   | 微信支付退款单号 示例值：50302603802022112227478742725       |
| data.refund_fee            | String   | 是   | 退款金额 示例值：0.01                                        |
| data.user_received_account | String   | 是   | 退款入账账户 示例值：支付用户零钱                            |
| data.success_time          | String   | 否   | 退款完成时间，当退款状态为退款成功时返回此参数。 示例值：2022-11-22 12:36:07 |
| msg                        | String   | 是   | 消息 示例值：查询成功                                        |
| request_id                 | String   | 是   | 唯一请求ID，每次请求都会返回，定位问题时需要提供该次请求的request_id。 示例值：74e51b04-dd6b-a319-3234-c46f53b9de45 |

成功示例

```json
{
    "code": 0, 
    "data": {
        "refund_status": 1, 
        "mch_id": "1230000109", 
        "out_trade_no": "ltzf1667389556", 
        "pay_no": "4200001667202211023770698203", 
        "order_no": "T0202211221235592690754030", 
        "out_refund_no": "TK2022112294916", 
        "pay_refund_no": "50302603802022112227478742725", 
        "refund_fee": "0.01", 
        "user_received_account": "支付用户零钱", 
        "success_time": "2022-11-22 12:36:07"
    }, 
    "msg": "查询成功", 
    "request_id": "74e51b04-dd6b-a319-3234-c46f53b9de45"
}
```

失败参数

| 参数名     | 参数类型 | 必填 | 描述                                                         |
| ---------- | -------- | ---- | ------------------------------------------------------------ |
| code       | Integer  | 是   | 返回状态，枚举值： 0：成功 1：失败 示例值：1                 |
| msg        | String   | 是   | 消息 示例值：签名错误                                        |
| request_id | String   | 是   | 唯一请求ID，每次请求都会返回，定位问题时需要提供该次请求的request_id。 示例值：22d3d7f6-0fca-0931-1f17-09e4d41edb6f |

失败示例

```json
{
    "code": 1, 
    "msg": "签名错误", 
    "request_id": "22d3d7f6-0fca-0931-1f17-09e4d41edb6f"
}
```



## 8.订单退款API

###### 对已经支付的订单发起退款。

**注意：**

- 交易时间超过一年的订单无法提交退款。
- 每个支付订单的部分退款次数不能超过50次。
- 同一笔订单多次退款的请求需相隔1分钟。

**特别提醒：**调用接口前请先在控制台微信支付商户管理修改设置白名单IP。

------

###### 接口说明

**适用对象：**个人、个体户、企业

**请求URL：**https://api.ltzf.cn/api/wxpay/refund_order

**请求方式：**POST

###### 请求参数

| 参数名        | 参数类型 | 必填 | 描述                                                         |
| ------------- | -------- | ---- | ------------------------------------------------------------ |
| mch_id        | String   | 是   | 商户号 示例值：1230000109                                    |
| out_trade_no  | String   | 是   | 商户订单号 示例值：LTZF2022111609188                         |
| out_refund_no | String   | 是   | 商户退款单号，只能是数字、大小写字母_-且在同一个商户号下唯一。 示例值：TK2022112100576 |
| timestamp     | String   | 是   | 当前时间戳 示例值：1669518774                                |
| refund_fee    | String   | 是   | 退款金额 示例值：0.01                                        |
| refund_desc   | String   | 否   | 退款描述 示例值：商品已售完                                  |
| notify_url    | String   | 否   | 退款通知地址，通知URL必须为直接可访问的URL，不允许携带查询串，要求必须为http或https地址，回调通知参数请参考[《退款通知》](https://www.ltzf.cn/doc#collapse_refund_notify)。 示例值：https://weixin.qq.com |
| sign          | String   | 是   | 签名，数据签名的算法请参考[《签名算法》](https://www.ltzf.cn/doc#collapse_sign)。 示例值：AD38ACEA706F2E46CCD668B8D2DEC57E |

请求示例代码（Java）

```java
HttpResponse<String> response = Unirest.post("https://api.ltzf.cn/api/wxpay/refund_order")
  .header("content-type", "application/x-www-form-urlencoded")
  .body("mch_id=1230000109&out_trade_no=LTZF2022111609188&out_refund_no=TK2022112100576&timestamp=1669518774&refund_fee=0.01&refund_desc=商品已售完&notify_url=https://weixin.qq.com&sign=AD38ACEA706F2E46CCD668B8D2DEC57E")
  .asString();
```

###### 返回参数

成功参数

| 参数名             | 参数类型 | 必填 | 描述                                                         |
| ------------------ | -------- | ---- | ------------------------------------------------------------ |
| code               | Integer  | 是   | 返回状态，枚举值： 0：成功 1：失败 示例值：0                 |
| data               | Object   | 是   | 返回数据                                                     |
| data.mch_id        | String   | 是   | 商户号 示例值：1230000109                                    |
| data.out_trade_no  | String   | 是   | 商户订单号 示例值：LTZF2022111609188                         |
| data.out_refund_no | String   | 是   | 商户退款单号 示例值：TK2022112100576                         |
| data.order_no      | String   | 是   | 系统退款单号 示例值：T0202211211939004893520234              |
| data.pay_refund_no | String   | 是   | 微信支付退款单号 示例值：50300203882022112127463972123       |
| msg                | String   | 是   | 消息 示例值：发起退款成功                                    |
| request_id         | String   | 是   | 唯一请求ID，每次请求都会返回，定位问题时需要提供该次请求的request_id。 示例值：d3dc7552-f132-81c9-9aa7-fb114d4ba97b |

成功示例

```json
{
    "code": 0, 
    "data": {
        "mch_id": "1230000109", 
        "out_trade_no": "LTZF2022111609188", 
        "out_refund_no": "TK2022112100576", 
        "order_no": "T0202211211939004893520234", 
        "pay_refund_no": "50300203882022112127463972123"
    }, 
    "msg": "发起退款成功", 
    "request_id": "d3dc7552-f132-81c9-9aa7-fb114d4ba97b"
}
```

失败参数

| 参数名     | 参数类型 | 必填 | 描述                                                         |
| ---------- | -------- | ---- | ------------------------------------------------------------ |
| code       | Integer  | 是   | 返回状态，枚举值： 0：成功 1：失败 示例值：1                 |
| msg        | String   | 是   | 消息 示例值：退款金额不能超过可退金额：0                     |
| request_id | String   | 是   | 唯一请求ID，每次请求都会返回，定位问题时需要提供该次请求的request_id。 示例值：1b2bafd7-f387-6151-015e-5b4261bc5209 |

失败示例

```json
{
    "code": 1, 
    "msg": "退款金额不能超过可退金额：0", 
    "request_id": "1b2bafd7-f387-6151-015e-5b4261bc5209"
}
```