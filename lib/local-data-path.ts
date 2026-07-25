import path from 'node:path';

/** 返回本地文件存储目录；未配置时保持项目原有的 data 目录。 */
export function getLocalDataDirectory(): string {
  const configuredDirectory = process.env.BLOG_DATA_DIR?.trim();
  return configuredDirectory
    ? path.resolve(/* turbopackIgnore: true */ process.cwd(), configuredDirectory)
    : path.join(process.cwd(), 'data');
}

/** 返回本地博客数据文件路径。 */
export function getLocalBlogDataFile(): string {
  return path.join(getLocalDataDirectory(), 'blog.json');
}

/** 返回本地博客备份目录路径。 */
export function getLocalBlogBackupDirectory(): string {
  return path.join(getLocalDataDirectory(), 'backups');
}

/** 返回本地 AI 配置文件路径。 */
export function getLocalAiConfigFile(): string {
  return path.join(getLocalDataDirectory(), 'ai-config.json');
}
