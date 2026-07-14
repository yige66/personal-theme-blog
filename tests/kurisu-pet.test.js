import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

describe('Makise Kurisu AI pet', () => {
  it('mounts a compact Kurisu assistant beside the synchronized music player', async () => {
    const [homeEffects, kurisuPet, kurisuApi, kurisuCopy, adminAiApi, aiConfig, adminConsole, adminConfig, adminTypes, gitignore, homeCss, envExample] = await Promise.all([
      readFile('components/HomeEffects.tsx', 'utf8'),
      readFile('components/PixelKurisuPet.tsx', 'utf8'),
      readFile('app/api/kurisu-pet/route.ts', 'utf8'),
      readFile('lib/kurisu-pet-copy.ts', 'utf8'),
      readFile('app/api/admin/ai/route.ts', 'utf8'),
      readFile('lib/ai-config.ts', 'utf8'),
      readFile('components/admin/BlogAdminConsole.tsx', 'utf8'),
      readFile('components/admin/adminConfig.ts', 'utf8'),
      readFile('components/admin/adminTypes.ts', 'utf8'),
      readFile('.gitignore', 'utf8'),
      readFile('app/home-overrides.css', 'utf8'),
      readFile('.env.example', 'utf8')
    ]);

    assert.match(homeEffects, /PixelKurisuPet/);
    assert.match(homeEffects, /effects\.floatingCompanion \? <PixelKurisuPet \/> : null/);
    assert.doesNotMatch(homeEffects, /!isHome && effects\.floatingCompanion/);
    assert.doesNotMatch(homeEffects, /className="xh-floating-companion"/);
    assert.match(homeEffects, /isMuted/);
    assert.match(homeEffects, /setVolume/);
    assert.match(homeEffects, /toggleMute/);
    assert.match(homeEffects, /xh-floating-player-volume/);
    assert.match(homeEffects, /aria-label=\{`音量 \$\{floatingVolumePercent\}%`\}/);
    assert.ok(
      homeEffects.indexOf('effects.floatingCompanion ? <PixelKurisuPet /> : null') < homeEffects.indexOf('className="xh-floating-player"')
    );

    assert.match(kurisuPet, /xh-pixel-kurisu-pet/);
    assert.match(kurisuPet, /xh-kurisu-sprite/);
    assert.match(kurisuPet, /牧濑红莉栖/);
    assert.match(kurisuPet, /Lab Assistant/);
    assert.match(kurisuPet, /让红莉栖给一个实验建议/);
    assert.match(kurisuPet, /aria-label="轻点牧濑红莉栖助手"/);
    assert.match(kurisuPet, /\/api\/kurisu-pet/);
    assert.match(kurisuPet, /正在整理回答/);
    assert.doesNotMatch(kurisuPet, /正在调用 AI API|AI API 暂时|AI API 没有返回/);
    assert.match(kurisuPet, /createAiErrorReply/);
    assert.match(kurisuPet, /KURISU_NO_AIAPI_REPLY/);
    assert.doesNotMatch(kurisuPet, /error\.message/);
    assert.match(kurisuPet, /data-toast=\{isToastVisible \|\| isThinking/);
    assert.match(kurisuPet, /isOpen \? \(/);
    assert.doesNotMatch(kurisuPet, /createLocalReply/);
    assert.doesNotMatch(kurisuPet, /xh-cat-chatbar/);

    assert.match(kurisuApi, /getResolvedAiConfig/);
    assert.doesNotMatch(kurisuApi, /process\.env\.OPENAI_API_KEY/);
    assert.doesNotMatch(kurisuApi, /api\.openai\.com|\/v1\/responses|Responses API|source: 'openai'/);
    assert.match(kurisuApi, /https:\/\/api\.deepseek\.com\/chat\/completions/);
    assert.match(kurisuApi, /max_tokens/);
    assert.match(kurisuApi, /thinking:\s*\{[\s\S]*type: 'disabled'/);
    assert.match(kurisuApi, /DEEPSEEK_TIMEOUT_MS/);
    assert.match(kurisuApi, /AbortSignal\.timeout\(DEEPSEEK_TIMEOUT_MS\)/);
    assert.match(kurisuApi, /KURISU_SYSTEM_PROMPT/);
    assert.match(kurisuApi, /必须用第一人称和用户互动/);
    assert.match(kurisuApi, /访客/);
    assert.match(kurisuApi, /不要把提问者默认当成站长/);
    assert.match(kurisuApi, /不要说自己是 AI、语言模型或接口/);
    assert.match(kurisuApi, /牧濑红莉栖/);
    assert.match(kurisuApi, /makisekurisu/);
    assert.match(kurisuApi, /不要复述或续写原作剧情/);
    assert.match(kurisuApi, /ai_config_missing/);
    assert.match(kurisuApi, /ai_api_unavailable/);
    assert.match(kurisuApi, /KURISU_NO_AIAPI_REPLY/);
    assert.match(kurisuApi, /createLocalPetReply/);
    assert.match(kurisuApi, /source: 'local'/);
    assert.match(kurisuApi, /source: 'deepseek'/);
    assert.match(kurisuApi, /DeepSeekChatMessage/);
    assert.match(kurisuApi, /messages: createDeepSeekMessages\(input\)/);
    assert.match(kurisuApi, /role: message\.role/);
    assert.match(kurisuApi, /站内导航|文章|项目|照片|音乐|友链|作者|留言/);
    assert.doesNotMatch(kurisuApi, /status: 503/);
    assert.doesNotMatch(kurisuApi, /status: 502/);
    assert.doesNotMatch(kurisuApi, /createFallbackReply/);
    assert.doesNotMatch(kurisuApi, /source: 'fallback'/);
    assert.doesNotMatch(kurisuApi, /NEXT_PUBLIC_OPENAI|NEXT_PUBLIC_DEEPSEEK/);

    assert.match(kurisuCopy, /KURISU_NO_AIAPI_REPLY/);
    assert.match(kurisuCopy, /本地模式/);
    assert.match(kurisuCopy, /访客/);
    const noApiReplyText = kurisuCopy.match(/KURISU_NO_AIAPI_REPLY =\n  '([^']+)'/)?.[1] ?? '';
    assert.doesNotMatch(noApiReplyText, /AIAPI|API|接口/);

    assert.match(adminAiApi, /isAdminAuthorized/);
    assert.match(adminAiApi, /getAiAdminConfigView/);
    assert.match(adminAiApi, /saveAiConfig/);
    assert.match(adminAiApi, /normalizeAiConfigInput/);
    assert.match(adminAiApi, /NextResponse\.json\(\{ config \}\)/);
    assert.match(aiConfig, /data', 'ai-config\.json'/);
    assert.match(aiConfig, /readPrivateBlob/);
    assert.match(aiConfig, /savePrivateBlob/);
    assert.match(aiConfig, /assertBlogStorageWritable/);
    assert.match(aiConfig, /getResolvedAiConfig/);
    assert.match(aiConfig, /DEEPSEEK_API_KEY/);
    assert.match(aiConfig, /DEEPSEEK_PET_MODEL/);
    assert.match(aiConfig, /DEEPSEEK_MODEL/);
    assert.match(aiConfig, /deepseek-v4-flash/);
    assert.match(aiConfig, /storedConfigLooksLegacy/);
    assert.doesNotMatch(aiConfig, /OPENAI_API_KEY|OPENAI_PET_MODEL|GPT-4|gpt-4/);
    assert.match(aiConfig, /apiKeySource/);
    assert.match(gitignore, /data\/ai-config\.json/);

    assert.match(adminTypes, /'ai-settings'/);
    assert.match(adminConfig, /DeepSeek 红莉栖/);
    assert.match(adminConsole, /\/api\/admin\/ai/);
    assert.match(adminConsole, /DeepSeek 设置/);
    assert.match(adminConsole, /deepseek-v4-flash/);
    assert.match(adminConsole, /留空则保留当前密钥/);
    assert.match(adminConsole, /清空后台密钥/);

    assert.match(homeCss, /\.xh-pixel-kurisu-pet/);
    assert.match(homeCss, /\.xh-kurisu-panel/);
    assert.match(homeCss, /\.xh-kurisu-chatbar/);
    assert.match(homeCss, /\.xh-kurisu-chat-toggle/);
    assert.match(homeCss, /Compact Makise Kurisu pet/);
    assert.match(homeCss, /Non-home vertical stack: day\/night switch, Kurisu, then synchronized radio player\./);
    assert.match(homeCss, /\.xh-floating-player-volume/);
    assert.match(homeCss, /body:has\(\.subpage\) \.xh-floating-player-volume input/);
    assert.match(homeCss, /kurisu-idle-0\.webp/);
    assert.match(homeCss, /width: 132px/);
    assert.match(homeCss, /bottom: 148px/);
    assert.match(homeCss, /bottom: clamp\(14px, 1\.8vw, 22px\) !important/);
    assert.match(homeCss, /bottom: clamp\(108px, 14vh, 128px\) !important/);
    assert.match(homeCss, /bottom: clamp\(270px, 38vh, 294px\) !important/);
    assert.match(homeCss, /Kurisu interactions keep the stack visible/);
    assert.doesNotMatch(homeCss, /body:has\(\.xh-pixel-kurisu-pet\[data-open="true"\]\) \.xh-floating-player/);
    assert.doesNotMatch(homeCss, /body:has\(\.xh-pixel-kurisu-pet\[data-toast="true"\]\) \.xh-theme-switch/);
    assert.match(homeCss, /right: 10px !important/);
    assert.match(homeCss, /bottom: 96px !important/);
    assert.match(homeCss, /bottom: 252px !important/);
    assert.match(homeCss, /bottom: 90px !important/);
    assert.match(homeCss, /bottom: 230px !important/);
    assert.match(homeCss, /@media \(max-height: 360px\)/);

    assert.match(envExample, /DEEPSEEK_API_KEY=your-deepseek-api-key/);
    assert.match(envExample, /DEEPSEEK_PET_MODEL=deepseek-v4-flash/);
    assert.match(envExample, /DEEPSEEK_MODEL=deepseek-v4-flash/);
    assert.doesNotMatch(envExample, /OPENAI_API_KEY|NEXT_PUBLIC_OPENAI_API_KEY|NEXT_PUBLIC_DEEPSEEK_API_KEY/);
  });
});
