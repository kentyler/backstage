# Project Instructions for AI Assistants

## Development Environment
- **Terminal**: Use PowerShell for all terminal commands
- **JavaScript**: Always use ES Modules (import/export)
- **React**: Current implementation is in the `frontend` directory
- **Backend**: Node.js with Express in the `backend` directory

## Code Style
- **Indentation**: 2 spaces
- **Quotes**: Single quotes for JS, double for JSX
- **Semicolons**: Yes
- **Line Length**: 100 characters

## Process
1. **Document First**: Create/update decision files before implementing
2. **Small Steps**: Make incremental, testable changes
3. **Ask Early**: If unsure about approach, ask for clarification
4. **PowerShell**: All terminal commands should be in PowerShell syntax

## Common Commands
```powershell
# Start frontend
Set-Location frontend
npm start

# Start backend
Set-Location ..\backend
npm start

# Create new decision file
.\scripts\new-decision.ps1 "Title of Decision"

# Create new component
New-Item -ItemType Directory -Path "src/components/NewComponent"
```

## Documentation
- Keep `docs/` directory updated
- Update `ARCHITECTURE.md` for significant changes
- Add new decisions to `docs/decisions/`

## Testing
- Write tests for new features
- Run tests before committing
- Update tests when changing behavior
