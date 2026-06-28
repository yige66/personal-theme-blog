import { createBlogServer } from './server.js';

const port = Number.parseInt(process.env.PORT || '4173', 10);
const server = createBlogServer();

server.listen(port, () => {
  console.log(`Personal theme blog is running at http://localhost:${port}`);
  console.log(`Admin console: http://localhost:${port}/admin.html`);
});
