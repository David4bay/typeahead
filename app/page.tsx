"use client";

import { useEffect, useRef, useState } from "react";

type Meaning = {
  partOfSpeech?: string;
  definitions?: Array<{ definition: string }>;
};

type WordEntry = {
  word: string;
  phonetic?: string;
  meanings?: Meaning[];
};

const DEBOUNCE_MS = 500;

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WordEntry[]>([]);
  const [status, setStatus] = useState<
    "idle" | "loading" | "empty" | "error" | "success"
  >("idle");
  const [activeIndex, setActiveIndex] = useState(-1);

  const requestId = useRef(0);

  useEffect(() => {
    const trimmedQuery = query.trim();
    const controller = new AbortController();
    const currentRequestId = ++requestId.current;

    setActiveIndex(-1);

    if (!trimmedQuery) {
      setResults([]);
      setStatus("idle");
      return () => controller.abort();
    }

    setStatus("loading");
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api?q=${trimmedQuery}`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error("Word not found");
        }

        const entries = (await response.json()) as WordEntry[];
        if (currentRequestId !== requestId.current) return;

        setResults(entries);
        setStatus(entries.length ? "success" : "empty");
      } catch {
        if (controller.signal.aborted || currentRequestId !== requestId.current)
          return;
        setResults([]);
        setStatus("error");
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? results.length - 1 : index - 1));
    } else if (event.key === "Escape") {
      setActiveIndex(-1);
    }
  };

  return (
    <main>
      <search>
        <label htmlFor="search">Search the dictionary</label>
        <input
          id="search"
          type="search"
          value={query}
          placeholder="Type a word"
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-controls="search-results"
          aria-expanded={results.length > 0}
          aria-activedescendant={
            activeIndex >= 0 ? `result-${activeIndex}` : undefined
          }
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
        />
      </search>

      <div aria-live="polite" className="status">
        {status === "loading" && <p>Loading...</p>}
        {status === "empty" && <p>No definitions found.</p>}
        {status === "error" && (
          <p role="alert">Could not find that word. Try another search.</p>
        )}
      </div>

      {status === "success" && (
        <div id="search-results" className="results" role="listbox">
          {results.map((entry, index) => (
            <div
              id={`result-${index}`}
              key={`${entry.word}-${index}`}
              role="option"
              tabIndex={-1}
              aria-selected={index === activeIndex}
              className={index === activeIndex ? "active" : undefined}
            >
              <h2>{entry.word}</h2>
              {entry.phonetic && <p className="phonetic">{entry.phonetic}</p>}
              {entry.meanings?.slice(0, 2).map((meaning, meaningIndex) => (
                <section key={`${entry.word}-meaning-${meaningIndex}`}>
                  {meaning.partOfSpeech && <h3>{meaning.partOfSpeech}</h3>}
                  <p>{meaning.definitions?.[0]?.definition}</p>
                </section>
              ))}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
