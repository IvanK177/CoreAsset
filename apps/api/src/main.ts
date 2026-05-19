import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import dotenv from "dotenv";
import { resolve } from "path";

// Load .env from monorepo root — try multiple resolution strategies
// When running via ts-node (dev), __dirname = apps/api/src → ../../../.env = monorepo root
// When running compiled (prod), __dirname = apps/api/dist → ../../../.env = monorepo root
// Fallback: process.cwd() based (when running from apps/api) → ../../.env = monorepo root
const monorepoRootEnv = resolve(__dirname, "../../../.env");
const cwdBasedEnv = resolve(process.cwd(), "../../.env");
dotenv.config({ path: monorepoRootEnv });
dotenv.config({ path: cwdBasedEnv }); // fallback if first didn't find the file

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend access
  // In development, allow any localhost port; in production, restrict to known origins
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://core-asset.vercel.app",
    "https://core-asset-api.vercel.app",
  ];

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (server-side, curl, etc.)
      if (!origin) return callback(null, true);

      // In development, allow any localhost origin regardless of port
      if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
        return callback(null, true);
      }

      // In production, only allow explicitly listed origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true,
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 CoreAsset GraphQL API running on http://localhost:${port}/graphql`);
}

bootstrap();