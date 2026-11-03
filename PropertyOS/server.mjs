
import { createServer } from "node:http";
import sirv from "sirv";

const port = Number(process.env.PORT || 3000);

const serve = sirv("dist", {
  dev: false
});

const server = createServer((req, res) => {
  serve(req, res, () => {
    res.statusCode = 404;
    res.end("Page not found");
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`PropertyOS running on port ${port}`);
});
