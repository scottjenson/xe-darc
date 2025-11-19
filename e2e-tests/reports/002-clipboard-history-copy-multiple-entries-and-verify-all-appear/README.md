# Test: clipboard-history-copy-multiple-entries-and-verify-all-appear

## User Story

As a user, I want to copy multiple text entries and see them all appear in the clipboard history sidebar.

## Acceptance Criteria

- [ ] Each copy operation captures the text
- [ ] Clipboard history sidebar shows all copied entries
- [ ] Entries appear in chronological order (newest first)
- [ ] Each entry displays the full copied text

## Test Steps

### Step 1: First Entry Copied and Visible

![First Entry Copied and Visible](screenshots/001-first-entry-copied.png)

**Description:** First entry copied: "First clipboard entry" and visible in sidebar

**Expected Outcomes:**
- First entry captured by clipboard monitor
- Sidebar shows 1 entry
- Entry text matches: "First clipboard entry"

### Step 2: Second Entry Copied and Visible

![Second Entry Copied and Visible](screenshots/002-second-entry-copied.png)

**Description:** Second entry copied: "Second clipboard entry" and visible in sidebar

**Expected Outcomes:**
- Second entry captured
- Sidebar shows 2 entries
- Entries in order: Second (newest), First

### Step 3: Third Entry Copied - All Entries Visible

![Third Entry Copied - All Entries Visible](screenshots/003-third-entry-copied.png)

**Description:** Third entry copied: "Third clipboard entry" - all three entries now visible

**Expected Outcomes:**
- Third entry captured
- Sidebar shows all 3 entries
- Entries in order: Third (newest), Second, First

