import { NextResponse } from "next/server"

const DICTIONARY_API = "https://api.dictionaryapi.dev/api/v2/entries/en"

export async function GET(request: Request) {

  const query = new URL(request.url).searchParams.get("q")?.trim()

  if (!query) {

    return NextResponse.json({ message: "A word is required." }, { status: 400 })
  }

  try {

    const response = await fetch(`${DICTIONARY_API}/${encodeURIComponent(query)}`, {
      next: { revalidate: 3600 },

    })

    const data = await response.json()

    if (!response.ok) {

      return NextResponse.json(
        { message: data?.message ?? "Word not found." },
        { status: response.status },

      )
        }

    return NextResponse.json(data)

  } catch {

    return NextResponse.json({ message: "Dictionary service unavailable." }, { status: 502 })
    
  }
}
