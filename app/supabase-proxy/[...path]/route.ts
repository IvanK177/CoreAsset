import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function handleProxy(request: NextRequest, path: string[]) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const targetUrl = new URL(path.join("/"), supabaseUrl);
  
  // Forward query parameters
  const searchParams = request.nextUrl.searchParams;
  searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  // Clone headers
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "host" && key.toLowerCase() !== "connection") {
      headers.set(key, value);
    }
  });

  // Force x-upsert to true on all PUT requests (makes avatar replacement seamless)
  if (request.method === "PUT") {
    headers.set("x-upsert", "true");
  }

  // Prepare fetch options
  const fetchOptions: RequestInit = {
    method: request.method,
    headers,
  };

  // If the request has a body and is not GET/HEAD/OPTIONS, read it as ArrayBuffer
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    try {
      const arrayBuffer = await request.arrayBuffer();
      if (arrayBuffer.byteLength > 0) {
        fetchOptions.body = Buffer.from(arrayBuffer);
      }
    } catch (err) {
      console.warn("Could not parse request body as arrayBuffer:", err);
    }
  }

  try {
    const res = await fetch(targetUrl.toString(), fetchOptions);
    
    // Create Response from target response
    const responseHeaders = new Headers();
    res.headers.forEach((value, key) => {
      // Do not copy content-encoding or transfer-encoding to avoid compression/chunking mismatches
      if (key.toLowerCase() !== "content-encoding" && key.toLowerCase() !== "transfer-encoding") {
        responseHeaders.set(key, value);
      }
    });

    const responseBuffer = await res.arrayBuffer();

    return new Response(Buffer.from(responseBuffer), {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Proxy error for path:", path.join("/"), error);
    return NextResponse.json({ error: "Proxy connection failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return handleProxy(request, path);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return handleProxy(request, path);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return handleProxy(request, path);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return handleProxy(request, path);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return handleProxy(request, path);
}

export async function OPTIONS(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return handleProxy(request, path);
}

export async function HEAD(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return handleProxy(request, path);
}
