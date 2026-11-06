# Wordly Dictionary (SPA)

A single page dictionary app for Wordly, an online language learning platform. Users search for an English word and see its details on the same page, without a reload.

## Features

- Search for a word using a form (input and submit button)
- Display phonetic text, part of speech, definitions, example usage, synonyms, and source link
- Play pronunciation audio when available
- Error messages for empty input, unknown words, and failed API requests
- Light and dark theme toggle
- Save favorite words and highlight them when searched again

## API

Free Dictionary API: `https://api.dictionaryapi.dev/api/v2/entries/en/<word>`

## Data Structure

The API returns an array of entries. Each entry has a `word`, a `phonetic`, a `phonetics` array of `{ text, audio }` objects, a `meanings` array, and `sourceUrls`. Each item in `meanings` has a `partOfSpeech`, a `definitions` array of `{ definition, example, synonyms }` objects, and a `synonyms` array. An unknown word returns a 404 response with a `title` of "No Definitions Found".

## Edge Cases Handled

- `audio` is often an empty string, so the first phonetics item with audio is used
- `example` and `synonyms` are often missing, so fallback messages are shown
- Empty or whitespace-only input is rejected before any request is made
- Network failures and 404 responses show different messages

## How to Run

1. Clone the repository
2. Open `index.html` in a browser (or use the VS Code Live Server extension)
3. Type a word and press Search

## Project Files

- `index.html`: page structure
- `style.css`: layout, themes, and hover effects
- `script.js`: fetching, parsing, DOM updates, and event handling
