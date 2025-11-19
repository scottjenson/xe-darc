<script>
	import { onMount } from 'svelte'
	import { getClipboardHistory, deleteClipboardEntry } from '../data.svelte.js'
	import ClipboardHistoryItem from './ClipboardHistoryItem.svelte'
	import RightSidebar from './RightSidebar.svelte'
	
	let { onClose, openSidebars, switchToResources, switchToSettings, switchToUserMods, switchToActivity, switchToAgent, switchToClipboardHistory, switchToDevTools, devModeEnabled = false } = $props()
	
	let clipboardEntries = $state([])
	let loading = $state(true)
	let refreshInterval
	
	async function loadEntries() {
		loading = true
		try {
			console.log('[ClipboardHistory] Loading entries...')
			clipboardEntries = await getClipboardHistory()
			console.log('[ClipboardHistory] Loaded', clipboardEntries.length, 'entries:', clipboardEntries)
		} catch (error) {
			console.error('Error loading clipboard history:', error)
		} finally {
			loading = false
		}
	}
	
	async function handleDelete(id) {
		try {
			await deleteClipboardEntry(id)
			// Remove from local array
			clipboardEntries = clipboardEntries.filter(entry => entry._id !== id)
		} catch (error) {
			console.error('Error deleting clipboard entry:', error)
		}
	}
	
	onMount(() => {
		console.log('[ClipboardHistory] Component mounted, loading entries...')
		loadEntries()
		
		// Refresh clipboard entries every 2 seconds to pick up new copies
		refreshInterval = setInterval(loadEntries, 2000)
		
		return () => {
			if (refreshInterval) {
				clearInterval(refreshInterval)
			}
		}
	})
</script>

<RightSidebar 
	title="Clipboard History"
	{onClose}
	{openSidebars}
	{switchToResources}
	{switchToSettings}
	{switchToUserMods}
	{switchToActivity}
	switchToAgent={switchToAgent}
	{switchToClipboardHistory}
	{switchToDevTools}
	{devModeEnabled}>
	<div class="clipboard-history">
		{#if loading}
			<div class="loading">Loading clipboard history...</div>
		{:else if clipboardEntries.length === 0}
			<div class="empty-state">
				<div class="empty-icon">📋</div>
				<div class="empty-title">No clipboard history yet</div>
				<div class="empty-message">Copy text to start building your history</div>
			</div>
		{:else}
			{@const _ = console.log('[ClipboardHistory RENDER] Rendering', clipboardEntries.length, 'entries')}
			<div class="clipboard-list">
				{#each clipboardEntries as entry (entry._id)}
					<ClipboardHistoryItem {entry} onDelete={handleDelete} />
				{/each}
			</div>
		{/if}
	</div>
</RightSidebar>

<style>
	.clipboard-history {
		height: 100%;
		overflow-y: auto;
		padding: 16px;
	}
	
	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 200px;
		color: rgba(255, 255, 255, 0.6);
		font-size: 14px;
	}
	
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 300px;
		text-align: center;
		padding: 32px;
	}
	
	.empty-icon {
		font-size: 64px;
		margin-bottom: 16px;
		opacity: 0.5;
	}
	
	.empty-title {
		font-size: 18px;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
		margin-bottom: 8px;
	}
	
	.empty-message {
		font-size: 14px;
		color: rgba(255, 255, 255, 0.6);
		max-width: 250px;
		line-height: 1.5;
	}
	
	.clipboard-list {
		display: flex;
		flex-direction: column;
	}
	
	/* Custom scrollbar */
	.clipboard-history::-webkit-scrollbar {
		width: 8px;
	}
	
	.clipboard-history::-webkit-scrollbar-track {
		background: rgba(255, 255, 255, 0.05);
	}
	
	.clipboard-history::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.2);
		border-radius: 4px;
	}
	
	.clipboard-history::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.3);
	}
</style>
