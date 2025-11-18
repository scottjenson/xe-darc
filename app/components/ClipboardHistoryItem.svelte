<script>
	let { entry, onDelete } = $props()
	
	// Format timestamp
	function formatTime(timestamp) {
		const date = new Date(timestamp)
		return date.toLocaleTimeString('en-US', { 
			hour: 'numeric', 
			minute: '2-digit',
			hour12: true 
		})
	}
</script>

<div class="clipboard-item">
	<div class="clipboard-item-header">
		<span class="timestamp">{formatTime(entry.timestamp)}</span>
		<button 
			class="delete-button" 
			onclick={() => onDelete(entry._id)}
			title="Delete"
			aria-label="Delete clipboard entry">
			🗑
		</button>
	</div>
	<div class="clipboard-item-content">
		{entry.content}
	</div>
</div>

<style>
	.clipboard-item {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		padding: 12px;
		margin-bottom: 12px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		transition: background 0.2s;
	}
	
	.clipboard-item:hover {
		background: rgba(255, 255, 255, 0.08);
	}
	
	.clipboard-item-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
		padding-bottom: 8px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}
	
	.timestamp {
		color: rgba(255, 255, 255, 0.6);
		font-size: 12px;
		font-weight: 500;
	}
	
	.delete-button {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 16px;
		padding: 4px 8px;
		border-radius: 4px;
		transition: background 0.2s;
		opacity: 0.6;
	}
	
	.delete-button:hover {
		background: rgba(255, 255, 255, 0.1);
		opacity: 1;
	}
	
	.clipboard-item-content {
		color: rgba(255, 255, 255, 0.9);
		font-size: 14px;
		line-height: 1.5;
		white-space: pre-wrap;
		word-break: break-word;
		max-height: 200px;
		overflow-y: auto;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
			'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
			sans-serif;
	}
	
	/* Custom scrollbar */
	.clipboard-item-content::-webkit-scrollbar {
		width: 6px;
	}
	
	.clipboard-item-content::-webkit-scrollbar-track {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 3px;
	}
	
	.clipboard-item-content::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.2);
		border-radius: 3px;
	}
	
	.clipboard-item-content::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.3);
	}
</style>
