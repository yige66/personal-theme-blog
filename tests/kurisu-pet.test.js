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
    assert.match(kurisuPet, /正在调用 AI API/);
    assert.match(kurisuPet, /createAiErrorReply/);
    assert.match(kurisuPet, /KURISU_NO_AIAPI_REPLY/);
    assert.doesNotMatch(kurisuPet, /error\.message/);
    assert.match(kurisuPet, /data-toast=\{isToastVisible \|\| isThinking/);
    assert.match(kurisuPet, /isOpen \? \(/);
    assert.doesNotMatch(kurisuPet, /createLocalReply/);
    assert.doesNotMatch(kurisuPet, /xh-cat-chatbar/);

    assert.match(kurisuApi, /getResolvedAiConfig/);
    assert.doesNotMatch(kurisuApi, /process\.env\.OPENAI_API_KEY/);
    assert.match(kurisuApi, /https:\/\/api\.openai\.com\/v1\/responses/);
    assert.match(kurisuApi, /max_output_tokens/);
    assert.match(kurisuApi, /KURISU_SYSTEM_PROMPT/);
    assert.match(kurisuApi, /必须用第一人称和用户互动/);
    assert.match(kurisuApi, /不要说自己是 AI、语言模型或接口/);
    assert.match(kurisuApi, /牧濑红莉栖/);
    assert.match(kurisuApi, /makisekurisu/);
    assert.match(kurisuApi, /不要复述或续写原作剧情/);
    assert.match(kurisuApi, /ai_config_missing/);
    assert.match(kurisuApi, /ai_api_unavailable/);
    assert.match(kurisuApi, /KURISU_NO_AIAPI_REPLY/);
    assert.match(kurisuApi, /source: 'fixed'/);
    assert.match(kurisuApi, /source: 'openai'/);
    assert.doesNotMatch(kurisuApi, /status: 503/);
    assert.doesNotMatch(kurisuApi, /status: 502/);
    assert.doesNotMatch(kurisuApi, /createFallbackReply/);
    assert.doesNotMatch(kurisuApi, /source: 'fallback'/);
    assert.doesNotMatch(kurisuApi, /NEXT_PUBLIC_OPENAI/);

    assert.match(kurisuCopy, /KURISU_NO_AIAPI_REPLY/);
    assert.match(kurisuCopy, /AIAPI还没接上/);

    assert.match(adminAiApi, /isAdminAuthorized/);
    assert.match(adminAiApi, /getAiAdminConfigView/);
    assert.match(adminAiApi, /saveAiConfig/);
    assert.match(adminAiApi, /normalizeAiConfigInput/);
    assert.match(adminAiApi, /NextResponse\.json\(\{ config \}\)/);
    assert.match(aiConfig, /data', 'ai-config\.json'/);
    assert.match(aiConfig, /getResolvedAiConfig/);
    assert.match(aiConfig, /OPENAI_API_KEY/);
    assert.match(aiConfig, /OPENAI_PET_MODEL/);
    assert.match(aiConfig, /OPENAI_SHEEP_MODEL/);
    assert.match(aiConfig, /apiKeySource/);
    assert.match(gitignore, /data\/ai-config\.json/);

    assert.match(adminTypes, /'ai-settings'/);
    assert.match(adminConfig, /AI 红莉栖/);
    assert.match(adminConsole, /\/api\/admin\/ai/);
    assert.match(adminConsole, /AI 红莉栖配置/);
    assert.match(adminConsole, /留空则保留当前密钥/);
    assert.match(adminConsole, /清空后台密钥/);

    assert.match(homeCss, /\.xh-pixel-kurisu-pet/);
    assert.match(homeCss, /\.xh-kurisu-panel/);
    assert.match(homeCss, /\.xh-kurisu-chatbar/);
    assert.match(homeCss, /\.xh-kurisu-chat-toggle/);
    assert.match(homeCss, /Compact Makise Kurisu pet/);
    assert.match(homeCss, /Non-home vertical stack: day\/night switch, Kurisu, then synchronized radio player\./);
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

    assert.match(envExample, /OPENAI_API_KEY=your-openai-api-key/);
    assert.match(envExample, /OPENAI_PET_MODEL=gpt-4\.1-mini/);
    assert.match(envExample, /OPENAI_SHEEP_MODEL=gpt-4\.1-mini/);
    assert.doesNotMatch(envExample, /NEXT_PUBLIC_OPENAI_API_KEY/);
  });
});
