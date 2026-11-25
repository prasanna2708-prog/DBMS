import type { AlgorithmMetrics, SortAlgorithm, TrieSearchResponse } from '../types/recipe.ts';

interface AlgorithmLabProps {
  metrics: AlgorithmMetrics | null;
  selectedAlgorithm: SortAlgorithm;
  onSelectAlgorithm: (algo: SortAlgorithm) => void;
  trieTelemetry: TrieSearchResponse | null;
}

export function AlgorithmLab({
  metrics,
  selectedAlgorithm,
  onSelectAlgorithm,
  trieTelemetry,
}: AlgorithmLabProps) {
  return (
    <section
      id="algorithm-lab"
      className="bg-white border border-[#E2E2DE] rounded-xl p-6 sm:p-8 space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#ECECE8]">
        <div className="space-y-1.5 max-w-2xl">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#18181B]">
            Data Structures & Algorithm Inspector
          </h2>
          <p className="text-sm text-[#52525B] leading-relaxed">
            Every pantry query runs through an Inverted Hash Index, Set Intersection scorer,
            Trie prefix tree, and your chosen sorting engine in real time on the Express backend.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#F4F4F1] rounded-lg shrink-0 self-start md:self-auto">
          {(
            [
              { id: 'merge_sort', label: 'Merge Sort' },
              { id: 'quick_sort', label: 'Quick Sort' },
              { id: 'heap_sort', label: 'Heap Sort' },
            ] as const
          ).map((algo) => {
            const active = selectedAlgorithm === algo.id;
            return (
              <button
                key={algo.id}
                type="button"
                onClick={() => onSelectAlgorithm(algo.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white text-[#18181B] shadow-xs'
                    : 'text-[#52525B] hover:text-[#18181B]'
                }`}
              >
                {algo.label}
              </button>
            );
          })}
        </div>
      </div>

      {metrics ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-5 bg-[#F7F7F5] border border-[#E2E2DE] rounded-lg space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-[#18181B]">
                01. Inverted Hash Index
              </h3>
              <p className="text-xs text-[#52525B]">
                Maps normalized ingredient keys directly to Recipe ID sets in O(1) average time.
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E2E2DE]">
              <div>
                <dt className="text-xs text-[#71717A]">Buckets Accessed</dt>
                <dd className="font-mono text-lg font-semibold text-[#18181B] tabular-nums">
                  {metrics.hashBucketsAccessed}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#71717A]">Candidates Evaluated</dt>
                <dd className="font-mono text-lg font-semibold text-[#18181B] tabular-nums">
                  {metrics.candidateRecipesEvaluated} / {metrics.totalRecipesInDb}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#71717A]">Pruning Gain</dt>
                <dd className="font-mono text-lg font-semibold text-[#166534] tabular-nums">
                  {metrics.pruningEfficiencyPercent}%
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#71717A]">Checks Avoided</dt>
                <dd className="font-mono text-lg font-semibold text-[#18181B] tabular-nums">
                  {metrics.bruteForceChecksAvoided}
                </dd>
              </div>
            </dl>

            {metrics.hashBucketSample.length > 0 && (
              <div className="pt-3 border-t border-[#E2E2DE] space-y-2">
                <div className="text-xs font-medium text-[#52525B]">Live Bucket Sample</div>
                <div className="space-y-1.5 font-mono text-[11px]">
                  {metrics.hashBucketSample.map((bucket) => (
                    <div
                      key={bucket.ingredient}
                      className="flex items-start justify-between gap-2 text-[#3F3F46]"
                    >
                      <span className="font-medium text-[#18181B] truncate">
                        "{bucket.ingredient}"
                      </span>
                      <span className="text-[#166534] tabular-nums shrink-0">
                        [{bucket.recipeIds.join(', ')}]
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-5 bg-[#F7F7F5] border border-[#E2E2DE] rounded-lg space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-[#18181B]">
                02. Sorting & Ranking Engine
              </h3>
              <p className="text-xs text-[#52525B]">
                {metrics.algorithmLabel} · {metrics.timeComplexity}
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E2E2DE]">
              <div>
                <dt className="text-xs text-[#71717A]">Comparisons</dt>
                <dd className="font-mono text-lg font-semibold text-[#18181B] tabular-nums">
                  {metrics.comparisonsPerformed}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#71717A]">Swaps / Merges</dt>
                <dd className="font-mono text-lg font-semibold text-[#18181B] tabular-nums">
                  {metrics.swapsOrMergesPerformed}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#71717A]">Latency</dt>
                <dd className="font-mono text-lg font-semibold text-[#166534] tabular-nums">
                  {metrics.executionTimeMicros} µs
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#71717A]">Rank Formula</dt>
                <dd className="font-mono text-xs font-medium text-[#18181B] pt-1">
                  |P ∩ R| / |R|
                </dd>
              </div>
            </dl>

            <div className="pt-3 border-t border-[#E2E2DE] text-xs text-[#52525B] leading-relaxed">
              Switch between Merge Sort (highest match %), Quick Sort (fastest cooking time),
              and Heap Sort (fewest missing items) to compare exact comparison counts.
            </div>
          </div>

          <div className="p-5 bg-[#F7F7F5] border border-[#E2E2DE] rounded-lg space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-[#18181B]">
                03. Trie Prefix Autocomplete
              </h3>
              <p className="text-xs text-[#52525B]">
                Character-indexed prefix tree traversing O(L + m) nodes without scanning all items.
              </p>
            </div>

            {trieTelemetry ? (
              <dl className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E2E2DE]">
                <div>
                  <dt className="text-xs text-[#71717A]">Active Prefix</dt>
                  <dd className="font-mono text-base font-semibold text-[#18181B] truncate">
                    "{trieTelemetry.prefix}"
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#71717A]">Trie Depth</dt>
                  <dd className="font-mono text-lg font-semibold text-[#18181B] tabular-nums">
                    {trieTelemetry.trieDepth}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#71717A]">Nodes Visited</dt>
                  <dd className="font-mono text-lg font-semibold text-[#166534] tabular-nums">
                    {trieTelemetry.nodesVisited}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#71717A]">Lookup Time</dt>
                  <dd className="font-mono text-lg font-semibold text-[#18181B] tabular-nums">
                    {trieTelemetry.executionTimeMicros} µs
                  </dd>
                </div>
              </dl>
            ) : (
              <div className="pt-3 border-t border-[#E2E2DE] text-xs text-[#52525B] leading-relaxed">
                Type a prefix in the Pantry search bar (such as &ldquo;tam&rdquo; or &ldquo;cur&rdquo;)
                to observe live Trie branch traversal depth and node visit counts here.
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-[#71717A]">Loading live metrics from backend...</p>
      )}
    </section>
  );
}
