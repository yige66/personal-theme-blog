export type FriendLinkApplicationData = {
  title: string;
  description: string;
  url: string;
  avatar: string;
};

export type FriendLinkApplicationParseResult =
  | { ok: true; data: FriendLinkApplicationData }
  | { ok: false; message: string };

/**
 * 解析前台友链申请区复制出的四行文本，并在写入后台记录前校验必填字段和链接协议。
 */
export function parseFriendLinkApplication(value: string): FriendLinkApplicationParseResult {
  const fields: Partial<FriendLinkApplicationData> = {};
  const lines = value.replace(/\r\n?/g, '\n').split('\n').map((line) => line.trim()).filter(Boolean);

  for (const line of lines) {
    const match = line.match(/^([^：:]+)\s*[：:]\s*(.*?)\s*$/);
    if (!match) {
      continue;
    }

    const label = match[1].trim();
    const content = match[2].trim();
    if (label === '名称' || label === '名字' || label === '站点名称') {
      fields.title = content;
    } else if (label === '简介' || label === '描述') {
      fields.description = content;
    } else if (label === '链接' || label === '网址' || label === '站点链接') {
      fields.url = content;
    } else if (label === '头像' || label === '图标' || label === '图片') {
      fields.avatar = content;
    }
  }

  const missing = [
    ['title', '名称'],
    ['description', '简介'],
    ['url', '链接'],
    ['avatar', '头像']
  ]
    .filter(([key]) => !fields[key as keyof FriendLinkApplicationData])
    .map(([, label]) => label);

  if (missing.length > 0) {
    return { ok: false, message: `格式不完整，请补充：${missing.join('、')}。` };
  }

  const data = fields as FriendLinkApplicationData;
  if (!isHttpUrl(data.url)) {
    return { ok: false, message: '链接必须是以 http:// 或 https:// 开头的网址。' };
  }

  if (!isHttpUrl(data.avatar)) {
    return { ok: false, message: '头像必须是以 http:// 或 https:// 开头的图片地址。' };
  }

  return { ok: true, data };
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\/[^\s]+$/i.test(value);
}
