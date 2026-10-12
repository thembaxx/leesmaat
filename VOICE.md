# Downloadable reading voices

Researched 12 October 2026. No paid speech service or user API key is required. Downloaded packs run in browser workers through Web Audio and Cache Storage; the reading text is never sent to the model host.

## Selected engines

[Piper voice models](https://huggingface.co/rhasspy/piper-voices) provide four natural English choices: Linda (US, female), John (US, male), Cori (UK, female) and Northern English (UK, male). The repository revision, exact model/config bytes and SHA-256 hashes are pinned in `src/lib/voice-catalogue.json`. Each model is about 63 MB; the shared phonemizer/ONNX engine is about 29 MB. Runtime files are bundled locally; model weights are fetched only after the reader chooses Download.

Model cards are committed under `public/licences`. The first three voices use public-domain training data; Northern English uses CC BY-SA 4.0 data. Model-repository weights use MIT licensing. Alan’s all-rights-reserved training card and Ryan’s noncommercial dataset were excluded. Country labels describe the voice model’s accent; gender follows model/dataset descriptions.

Piper currently lists no Afrikaans model. [eSpeak-NG](https://github.com/espeak-ng/espeak-ng) supplies Afrikaans using a roughly 3.3 MB shared compact engine/data pack. The male and female selections are documented synthetic tone variants, labelled as such rather than presented as neural recordings. Both share the same download. The GPL-3.0-or-later worker stays separate; licence and exact compiled-source links are in `public/licences`.

The neural worker uses [`@diffusionstudio/piper-wasm`](https://github.com/diffusion-studio/piper-wasm) for phonemization and [ONNX Runtime Web 1.18.0](https://github.com/microsoft/onnxruntime/tree/v1.18.0) for single-thread SIMD inference. It reloads both model and config when changing voices. This version is pinned for the tested WASM interface. The [Mintplex Piper browser implementation](https://github.com/Mintplex-Labs/piper-tts-web) informed the research, but its global model singleton was not adopted. Kokoro was also considered; its larger English-only quantized base did not improve Afrikaans coverage.

## Preview and storage

English previews are small recordings supplied by the pinned model repository. Afrikaans previews were synthesized from the shipped worker. Previews work before downloading a model. Settings show separate voice and shared-engine sizes, download progress, cancellation, removal and country/gender filters. Custom-text previews use the selected downloaded pack. Downloads verify both exact bytes and SHA-256 before installation; incomplete downloads roll back newly staged files.

Speech synthesis consumes more memory than its download size, particularly on older phones. Generation runs in a worker and errors offer the compact or system fallback. A selected pack works without a service worker because its models, JavaScript, WASM and data are loaded from Cache Storage into blob-backed workers. Removing a pack releases its worker and storage. Browsers can evict storage; the app reconciles installed packs on startup.

Browser SpeechSynthesis remains available. Its API does not expose pack download, gender or size; the app therefore lists system-provided names/languages and their local/online flag. Remote system voices may contact their system provider. System voice installation is managed by the OS.

## Validation

Real Chromium execution verified both Afrikaans variants and English neural synthesis, including switching model/config and blocked-network synthesis. Automated browser checks cover compact-pack download, preview, choice, offline reading, removal, country/gender filters and download failure feedback. Unit tests verify runtime checksums and preview assets. Physical iOS/Android testing remains useful because browser memory limits and audio policies vary.
