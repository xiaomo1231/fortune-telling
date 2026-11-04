import { createHmac, randomUUID } from "node:crypto";

export interface SmsResult { delivered: boolean; devCode?: string; }

/** 发送短信验证码。dev 模式只打印日志，并在非生产环境把验证码返回给前端方便测试。 */
export async function sendSmsCode(phone: string, code: string): Promise<SmsResult> {
  const provider = process.env.SMS_PROVIDER || "dev";
  if (provider === "aliyun") { await aliyunSend(phone, code); return { delivered: true }; }
  console.info(`[sms:dev] ${phone} 验证码 ${code}`);
  return { delivered: false, devCode: process.env.NODE_ENV !== "production" || process.env.SMS_DEV_ECHO === "true" ? code : undefined };
}

// 阿里云短信 SendSms（RPC 风格，签名方法 HMAC-SHA1）
async function aliyunSend(phone: string, code: string) {
  const id = process.env.ALIYUN_ACCESS_KEY_ID!, secret = process.env.ALIYUN_ACCESS_KEY_SECRET!;
  const params: Record<string, string> = {
    AccessKeyId: id, Action: "SendSms", Format: "JSON", PhoneNumbers: phone, RegionId: "cn-hangzhou",
    SignName: process.env.ALIYUN_SMS_SIGN_NAME!, SignatureMethod: "HMAC-SHA1", SignatureNonce: randomUUID(), SignatureVersion: "1.0",
    TemplateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE!, TemplateParam: JSON.stringify({ code }), Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"), Version: "2017-05-25",
  };
  const enc = (s: string) => encodeURIComponent(s).replace(/\+/g, "%20").replace(/\*/g, "%2A").replace(/%7E/g, "~");
  const qs = Object.keys(params).sort().map((k) => `${enc(k)}=${enc(params[k])}`).join("&");
  const sig = createHmac("sha1", secret + "&").update(`GET&${enc("/")}&${enc(qs)}`).digest("base64");
  const res = await fetch(`https://dysmsapi.aliyuncs.com/?Signature=${enc(sig)}&${qs}`);
  const j = (await res.json()) as { Code?: string; Message?: string };
  if (j.Code !== "OK") throw new Error(`短信发送失败：${j.Code} ${j.Message}`);
}
