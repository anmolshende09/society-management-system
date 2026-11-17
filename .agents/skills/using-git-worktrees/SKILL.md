---
name: using-git-worktrees
description: Guidelines for setting up and managing isolated Git worktrees for parallel tasks, spikes, or subagent workspaces
---

# Skill: using-git-worktrees

## Purpose

Allow independent, concurrent development or complex research spikes without disturbing the primary working tree or risking cross-branch file collisions.

## Procedure

### 1. Create a Worktree

```bash
# Create a new branch and checkout into an isolated directory
git worktree add ../society-erp-<branch-name> -b feature/<branch-name>
```

### 2. Initialize Dependencies in the Worktree

```bash
cd ../society-erp-<branch-name>
pnpm install --frozen-lockfile
```

### 3. Work and Verify

Execute plan tasks within the isolated worktree following TDD and verification standards.

### 4. Clean Up After Merge

```bash
# Return to main workspace
cd ../society-erp

# Remove the worktree
git worktree remove ../society-erp-<branch-name>
```
