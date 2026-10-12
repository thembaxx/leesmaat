# Offline reading assistant

The optional assistant runs WebLLM 0.2.85 in a dedicated browser worker. No model API, server inference, account or API key is used. Downloaded model artifacts and the worker persist in Cache Storage. Reading text and generated answers stay in the browser; answers are held only in memory and never added to public library or LLM-index endpoints.

## Scope

- Settings → Offline reading assistant: device checks, exact sizes, explicit downloads, byte progress, cancellation, selection and removal.
- Reader → Reading assistant: a source-linked summary of the available reading or selected book chapter/scene.
- Select text → spark icon: explain the selected passage in simpler language.
- Existing summaries, dictionary entries, study questions and other reading features remain available independently of model support.

This first version does not include book-wide chat, embeddings, external retrieval, model-generated dictionary definitions or cloud fallback.

## Models and compatibility

Two four-bit, float32 WebGPU variants are pinned:

- Qwen 2.5 0.5B Instruct: about **300.4 MB** including the shared 6.0 MB worker. Apache 2.0 model licence.
- Llama 3.2 1B Instruct: about **715.7 MB** including the worker. Meta Llama 3.2 Community Licence; the UI includes “Built with Llama” attribution.

Exact sizes and SHA-256 hashes come from immutable Hugging Face model revisions and a pinned MLC model-library commit in `src/lib/assistant-models.json`. The compiled library matches WebLLM's `v0_2_84/base` registry for version 0.2.85. f32 variants avoid requiring the optional shader-f16 feature. The runtime is rebuilt separately by `scripts/build-assistant.mjs`; large weights are never committed or included in the default service-worker shell.

WebGPU hardware graphics, a storage-buffer limit of at least 128 MiB, secure-context storage and Worker support are required. Devices reporting less than 4 GB of system memory are declined conservatively; memory reporting is unavailable in some browsers. The compiled profiles estimate about 1.1 GB of working graphics memory. Actual memory availability cannot be measured reliably through browser APIs. Software graphics adapters are declined because generation is impractically slow. Browsers without these capabilities keep the existing summaries.

Small models have limited reasoning and Afrikaans fluency. Generated output is labelled AI-generated and should be checked against supporting text. Neither a valid citation ID nor a constrained JSON response proves that a claim is factually correct.

## Source coverage and privacy

Source text is split into contiguous, UTF-8-bounded passages with exact original ranges. For a summary, **every passage of the current reading/chapter** is processed. Source-linked intermediate notes are reduced in bounded groups until a short set of talking points remains. Each output point must name source IDs from its supplied input; malformed responses, unknown source IDs and truncated answers fail without displaying partial output. This preserves evidence identifiers across reduction and bounds the small model's context window.

The scope is the current chapter/scene or available short reading, never the full book unless the available text is itself the complete book. Generated citations jump back to highlighted original text, and the assistant panel also exposes the supporting passages.

Prompts treat reading text as data, and generated text renders as escaped React strings. The model has no tools or external retrieval. The inference worker's fetch and Cache.add paths are disabled; a missing cached artifact fails with a re-download message. Only explicit downloads contact Hugging Face / GitHub for public model files; requests omit credentials and referrers. No reading text is included in those requests.

## Storage and lifecycle

Downloads verify exact byte counts and SHA-256 before caching each artifact. Failure or cancellation removes newly staged files. Verified partial files left by a browser shutdown can be reused; the panel shows remaining bytes. Storage capacity is checked before downloading. Removing a model clears its artifacts and releases its worker, while voice files and reading downloads remain separate.

Generation runs outside the UI thread. Stop, closing an active assistant panel, provider teardown and RPC failures can cancel it. A five-minute request timeout prevents an indefinitely stuck GPU job. An idle worker is released after 30 seconds. Browser storage eviction and GPU memory/device loss remain possible; the app reports these failures and keeps its existing reading tools available.

## Reproduction

```sh
pnpm assistant:import       # deliberately refresh pinned upstream metadata and licence notices
node scripts/build-assistant.mjs
pnpm format
pnpm test
pnpm build
pnpm test:e2e
```

Imported manifests are committed, so normal builds do not download model weights. `pnpm build` bundles the optional worker and refreshes its digest. Cache API namespaces match WebLLM's documented model/config/WASM cache format.

Relevant sources: [WebLLM advanced usage](https://webllm.mlc.ai/docs/user/advanced_usage.html), [model registry](https://github.com/mlc-ai/web-llm/blob/main/src/config.ts), [Qwen](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct), [Llama](https://huggingface.co/meta-llama/Llama-3.2-1B-Instruct).

## Validation evidence

The local suite includes 20 unit tests and 34 production browser tests. Assistant browser tests use controlled worker replies to verify UI lifecycle and exact source jumps independently of GPU availability. Other tests cover complete source coverage, Unicode bounds, citation rejection, immutable downloads, altered-byte rejection, cancellation, cache removal, existing summaries and accessible unsupported-device behavior.

A real compact-model download verified every artifact and loaded successfully with the network disabled. This managed environment exposes only SwiftShader software graphics; real generation exceeded the five-minute timeout. Software adapters are now rejected by the product capability check. **Generation speed and model-answer quality on hardware WebGPU remain a manual validation item.** No hardware-inference success is claimed by the CI fixtures.
