<script lang="ts">
  import type { PageData } from "./$types";
  import { onMount } from "svelte";
  import Chart from "chart.js/auto";

  let { data }: { data: PageData } = $props();
  console.log(data);

  const engagementData = Array.isArray(data.data) ? data.data : [];
  let chartContainer: HTMLCanvasElement | null = null;
  let chartInstance: Chart | null = null;

  // Grouped data
  let groupedData: Record<string, number[]> = {};

  // Artists for filtering
  let selectedArtists: string[] = [];

  // Back button visibility
  let showBackButton = false;

  onMount(() => {
    groupedData = engagementData.reduce((acc: any, { artist_id, hour, total_score }) => {
      if (!acc[artist_id]) acc[artist_id] = new Array(24).fill(0);
      acc[artist_id][hour] = total_score;
      return acc;
    }, {});

    createChart();
  });

  function createChart() {
    if (chartInstance) {
      chartInstance.destroy();
    }

    const datasets = Object.keys(groupedData)
      .filter((artist_id) => selectedArtists.length === 0 || selectedArtists.includes(artist_id))
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
              onClick: (e, legendItem) => toggleArtist(legendItem.text.split(" ")[1]),
            },
            title: { display: true, text: "Artist Engagement by Hour", font: { size: 20 } },
          },
          scales: {
            x: {
              ticks: { color: "#374151", font: { size: 12 } },
              title: { display: true, text: "Hour", color: "#6B7280", font: { size: 16 } },
            },
            y: {
              ticks: { color: "#374151", font: { size: 12 } },
              title: { display: true, text: "Engagement Score", color: "#6B7280", font: { size: 16 } },
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

  function resetFilters() {
    selectedArtists = [];
    showBackButton = false; // Hide back button when no filter
    createChart();
  }
</script>

<div class="flex flex-col items-center space-y-8 bg-gray-100 p-6 rounded-lg shadow-lg">
  <!-- Title -->
  <h1 class="text-2xl font-bold text-gray-800">Artist Engagement Dashboard</h1>

  <!-- Artist Filter -->
  {#if !showBackButton}
    <div class="flex flex-wrap gap-4 justify-center mt-4">
      {#each Object.keys(groupedData) as artist_id}
        <button
          class={`px-4 py-2 rounded-lg focus:outline-none transition-all duration-300 ${
            selectedArtists.includes(artist_id)
              ? "bg-orange-500 text-white hover:bg-orange-600"
              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
          }`}
          on:click={() => toggleArtist(artist_id)}
        >
          {`Filter Artist ${artist_id}`}
        </button>
      {/each}
    </div>
  {/if}

  <!-- Back Button -->
  {#if showBackButton}
    <button
      class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 mt-4"
      on:click={resetFilters}
    >
      Back to All Artists
    </button>
  {/if}

  <!-- Graph -->
  <div class="w-full max-w-6xl bg-white p-4 rounded-lg shadow-md">
    <canvas bind:this={chartContainer}></canvas>
  </div>
</div>

<style>
  button {
    font-weight: 500;
  }
</style>
