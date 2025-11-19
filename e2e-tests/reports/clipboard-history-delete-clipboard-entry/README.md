# Test Report: Delete Clipboard Entry

**Generated**: 2025-11-19T15:11:25.983Z

**Total Steps**: 2

## User Story

As a user, I want to delete clipboard entries I no longer need so my history stays clean

### Acceptance Criteria

- Clipboard sidebar is visible and open
- Entry "Entry to be deleted" is displayed
- Delete button (trash icon) is present next to the entry
- User can click delete button

---


## Step 1: Entry visible before delete

Clipboard sidebar is open showing an entry "Entry to be deleted" with a delete button

![Entry visible before delete](./screenshots/001-before-delete.png)

### Expectations

- ✓ Sidebar displays clipboard history
- ✓ Entry is visible in the list
- ✓ Delete button is accessible

---

## Step 2: Empty state after delete

After clicking delete, the entry is removed and empty state is shown in the open sidebar

![Empty state after delete](./screenshots/002-after-delete.png)

### Expectations

- ✓ Entry is successfully deleted
- ✓ Sidebar shows empty state
- ✓ UI updates immediately after deletion

