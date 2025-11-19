// Debug script to check clipboard entries in database vs UI
import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  console.log('🔍 Debugging Clipboard UI Issue\n');
  console.log('📍 Navigating to app...');
  await page.goto('https://localhost:5194');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);

  console.log('\n✓ App loaded\n');
  
  console.log('📋 Step 1: Copy text to clipboard...');
  const testText = 'Debug test entry ' + Date.now();
  await page.evaluate((text) => {
    console.log('[Browser] Copying text:', text);
    const div = document.createElement('div');
    div.textContent = text;
    div.style.position = 'fixed';
    div.style.left = '-9999px';
    div.style.userSelect = 'text';
    document.body.appendChild(div);
    
    const range = document.createRange();
    range.selectNodeContents(div);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    
    const copyEvent = new ClipboardEvent('copy', { bubbles: true });
    document.dispatchEvent(copyEvent);
    console.log('[Browser] Copy event dispatched');
    document.body.removeChild(div);
  }, testText);

  await page.waitForTimeout(2000);
  console.log('✓ Text copied\n');

  console.log('🗄️  Step 2: Check database for entries...');
  const dbCheck = await page.evaluate(async () => {
    const PouchDB = (await import('pouchdb-browser')).default;
    const db = new PouchDB('darc', { adapter: 'idb' });
    
    const all = await db.allDocs({ include_docs: true, startkey: 'clipboard:', endkey: 'clipboard:\uffff' });
    return {
      count: all.rows.length,
      entries: all.rows.map(row => ({
        id: row.id,
        content: row.doc.content,
        timestamp: row.doc.timestamp
      }))
    };
  });

  console.log(`   Found ${dbCheck.count} entries in database:`);
  dbCheck.entries.forEach((entry, i) => {
    console.log(`   ${i + 1}. ${entry.content.substring(0, 50)}... (${entry.id})`);
  });

  console.log('\n🚪 Step 3: Open clipboard sidebar...');
  await page.click('button[title="Clipboard History"]');
  await page.waitForTimeout(2000);
  console.log('✓ Sidebar opened\n');

  console.log('👀 Step 4: Check what UI is showing...');
  const uiCheck = await page.evaluate(() => {
    const sidebar = document.querySelector('.clipboard-history');
    if (!sidebar) {
      return { error: 'Sidebar element not found in DOM' };
    }
    
    const loading = sidebar.querySelector('.loading');
    if (loading) {
      return { state: 'loading', text: loading.textContent };
    }
    
    const emptyState = sidebar.querySelector('.empty-state');
    if (emptyState) {
      return {
        state: 'empty',
        title: emptyState.querySelector('.empty-title')?.textContent,
        message: emptyState.querySelector('.empty-message')?.textContent
      };
    }
    
    const clipboardList = sidebar.querySelector('.clipboard-list');
    if (clipboardList) {
      const items = clipboardList.querySelectorAll('.clipboard-item');
      return {
        state: 'has-items',
        itemCount: items.length,
        items: Array.from(items).map(item => ({
          content: item.querySelector('.clipboard-content')?.textContent || 'no content',
          hasDeleteButton: !!item.querySelector('button')
        }))
      };
    }
    
    return { error: 'Unknown state - no loading, empty, or list found' };
  });

  console.log('   UI State:', JSON.stringify(uiCheck, null, 2));

  console.log('\n🔬 Step 5: Debug component state...');
  const componentState = await page.evaluate(async () => {
    // Try to call getClipboardHistory directly
    try {
      const { getClipboardHistory } = await import('/app/data.svelte.js');
      const entries = await getClipboardHistory();
      return {
        functionResult: {
          count: entries.length,
          entries: entries.map(e => ({ id: e._id, content: e.content.substring(0, 30) }))
        }
      };
    } catch (error) {
      return { error: error.message };
    }
  });

  console.log('   Function call result:', JSON.stringify(componentState, null, 2));

  console.log('\n📸 Taking screenshot for visual inspection...');
  await page.screenshot({ path: './debug-clipboard-screenshot.png' });
  console.log('✓ Screenshot saved to debug-clipboard-screenshot.png');

  await browser.close();
  
  console.log('\n🏁 Debug complete!');
  console.log('\n📊 Summary:');
  console.log(`   Database entries: ${dbCheck.count}`);
  console.log(`   UI state: ${uiCheck.state || uiCheck.error}`);
  if (uiCheck.state === 'has-items') {
    console.log(`   UI items shown: ${uiCheck.itemCount}`);
  }
})();
