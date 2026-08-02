# UX Flow

## Primary Journey

1. Landing page
2. Add screenshot
3. Add optional context
4. Review submission
5. Processing state
6. Results
7. Copy or download report
8. Start another review

## Screen Requirements

### 1. Landing and Input

Purpose: explain the tool and collect one screenshot.

Required elements:

- Clear product name and one-sentence value proposition
- Privacy note explaining that users should not upload confidential screens
- Drag-and-drop area with browse fallback
- Accepted file types and size guidance
- Optional fields for screen title, product context, and target user
- Primary action: `Review interface`

### 2. Review Confirmation

Purpose: help users verify the selected input before processing.

Required elements:

- Screenshot preview
- File name and size
- Entered context
- Replace and remove actions
- Submit action

### 3. Processing

Purpose: communicate progress without pretending to provide exact completion percentages.

Required elements:

- Descriptive status message
- Visible loading state
- Cancel or reset action where technically safe
- No fabricated progress percentage

### 4. Results

Purpose: make the review easy to scan and actionable.

Required hierarchy:

1. Overall summary
2. Finding count by severity
3. Findings list
4. Report actions
5. Limitations and disclaimer

Each finding includes:

- Title
- Severity
- Category
- Observation
- Why it matters
- Recommendation
- Confidence

## States

- Empty
- File selected
- Invalid file
- File too large
- Ready to submit
- Processing
- Successful result
- Partial or invalid AI response
- Network or service error

## Accessibility Requirements

- Every action is keyboard operable.
- Focus order follows the visual workflow.
- Drop zone has an equivalent file-input control.
- Status updates use an appropriate live region.
- Severity is communicated by text, not color alone.
- Errors identify the problem and provide recovery guidance.
- Screenshot preview includes a meaningful user-provided or generated text alternative.

## Responsive Behaviour

- Single-column flow on small screens
- Input and supporting guidance may use two columns on larger screens
- Results remain readable without horizontal scrolling
- Report actions remain reachable after long results
