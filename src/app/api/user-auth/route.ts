export async function GET(request: Request) {
  const headers = request.headers;
  const body = request.body;
  return { headers, body };
}

export async function HEAD(request: Request) {
  const headers = request.headers;
  const body = request.body;
  console.log(headers, body);

  return { headers, body };
}

export async function POST(request: Request) {
  const headers = request.headers;
  const body = request.body;
  console.log(headers, body);
  return { headers, body };
}

export async function PUT(request: Request) {}

export async function DELETE(request: Request) {}

export async function PATCH(request: Request) {}

// If `OPTIONS` is not defined, Next.js will automatically implement `OPTIONS` and  set the appropriate Response `Allow` header depending on the other methods defined in the route handler.
export async function OPTIONS(request: Request) {}
