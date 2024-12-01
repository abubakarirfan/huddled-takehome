<script lang="ts">
  import type { PageData } from "./$types";
  import { onMount } from "svelte";
  import Chart from "chart.js/auto";

  let { data }: { data: PageData } = $props();

  const engagementData = Array.isArray(data.data) ? data.data : [];
  let chartContainer: HTMLCanvasElement | null = null;
  let chartInstance: Chart | null = null;

  // Grouped data
  let groupedData: Record<string, number[]> = engagementData.reduce(
    (acc, { artist_id, hour, total_score }) => {
      if (!acc[artist_id]) acc[artist_id] = new Array(24).fill(0);
      acc[artist_id][parseInt(hour, 10)] = total_score;
      return acc;
    },
    {}
  );

  // Artists for filtering
  let selectedArtists: string[] = [];

  // Back button visibility
  let showBackButton = false;

  onMount(() => {
    createChart();
  });

  function createChart() {
    if (chartInstance) {
      chartInstance.destroy();
    }

    const datasets = Object.keys(groupedData)
      .filter(
        (artist_id) =>
          selectedArtists.length === 0 || selectedArtists.includes(artist_id)
      )
      .map((artist_id) => ({
        label: `Artist ${artist_id}`,
        data: groupedData[artist_id],
        fill: false,
        borderColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
        tension: 0.1,
      }));

    if (chartContainer) {
      chartInstance = new Chart(chartContainer, {
        type: "line",
        data: {
          labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
          datasets,
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: "top",
              labels: {
                usePointStyle: true,
                font: { size: 14 },
                padding: 20,
              },
              onClick: (e, legendItem) =>
                toggleArtist(legendItem.text.split(" ")[1]),
            },
            title: {
              display: true,
              text: "Artist Engagement by Hour",
              font: { size: 20 },
            },
          },
          scales: {
            x: {
              ticks: { color: "#374151", font: { size: 12 } },
              title: {
                display: true,
                text: "Hour",
                color: "#6B7280",
                font: { size: 16 },
              },
            },
            y: {
              ticks: { color: "#374151", font: { size: 12 } },
              title: {
                display: true,
                text: "Engagement Score",
                color: "#6B7280",
                font: { size: 16 },
              },
            },
          },
        },
      });
    }
  }

  function toggleArtist(artist_id: string) {
    if (selectedArtists.includes(artist_id)) {
      selectedArtists = selectedArtists.filter((id) => id !== artist_id);
    } else {
      selectedArtists = [artist_id]; // Filter by a single artist at a time
      showBackButton = true; // Show back button when filtered
    }
    createChart();
  }
</script>

<div
  class="flex flex-col items-center space-y-8 bg-gray-100 p-6 rounded-lg shadow-lg"
>
  <!-- Title -->
  <h1 class="text-2xl font-bold text-gray-800">Artist Engagement Dashboard</h1>

  <div
    class="grid grid-cols-2 md:grid-cols-3 gap-3 bg-white p-4 rounded-lg shadow-md w-full max-w-6xl"
  >
    <div class="text-center">
      <h3 class="text-lg font-bold text-gray-700">Total Engagements</h3>
      <p class="text-2xl font-semibold text-gray-900">
        {engagementData.reduce((acc, { total_score }) => acc + total_score, 0)}
      </p>
    </div>
    <div class="text-center">
      <h3 class="text-lg font-bold text-gray-700">Top Artist</h3>
      <p class="text-2xl font-semibold text-gray-900">
        {Object.entries(groupedData).reduce(
          (top, [artist, scores]) => {
            const total = scores.reduce((a, b) => a + b, 0);
            return total > top.score ? { artist, score: total } : top;
          },
          { artist: "None", score: 0 }
        ).artist}
      </p>
    </div>
    <div class="text-center">
      <h3 class="text-lg font-bold text-gray-700">Average Engagement/Hour</h3>
      <p class="text-2xl font-semibold text-gray-900">
        {(
          engagementData.reduce(
            (acc, { total_score }) => acc + total_score,
            0
          ) / 24
        ).toFixed(2)}
      </p>
    </div>
  </div>

  <!-- Graph -->
  <div class="w-full max-w-6xl bg-white p-4 rounded-lg shadow-md">
    <canvas bind:this={chartContainer}></canvas>
  </div>

  <!-- Artist Rankings -->
  <div class="w-full max-w-6xl bg-white p-4 rounded-lg shadow-md mt-6">
    <h3 class="text-lg font-bold text-gray-700 mb-4">Artist Rankings</h3>
    <table
      class="table-auto w-full text-left border-collapse border border-gray-200"
    >
      <thead class="bg-gray-100">
        <tr>
          <th class="border border-gray-200 px-4 py-2">Rank</th>
          <th class="border border-gray-200 px-4 py-2">Artist</th>
          <th class="border border-gray-200 px-4 py-2">Total Engagement</th>
        </tr>
      </thead>
      <tbody>
        {#each Object.entries(groupedData)
          .map( ([artist_id, scores]) => ({ artist_id, total_score: scores.reduce((a, b) => a + b, 0) }) )
          .sort((a, b) => b.total_score - a.total_score) as { artist_id, total_score }, index}
          <tr class={index % 2 === 0 ? "bg-gray-50" : ""}>
            <td class="border border-gray-200 px-4 py-2">{index + 1}</td>
            <td class="border border-gray-200 px-4 py-2"
              >{`Artist ${artist_id}`}</td
            >
            <td class="border border-gray-200 px-4 py-2">{total_score}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
</style>
