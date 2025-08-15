# Fluid Framework & Cosmos DB Integration Strategy

## Executive Summary
BrainFlowy uses Cosmos DB for persistent storage. Fluid Framework would be an optional enhancement for real-time collaboration, not a storage replacement.

## Architecture Decision

### What We're Building (Phase 2)
```
Frontend → FastAPI → Cosmos DB
```
- Single-user editing with auto-save
- Document-based storage in Cosmos
- Simple, cost-effective, scalable

### Future Enhancement (Phase 3+)
```
Frontend → Fluid Framework → Azure Fluid Relay (real-time)
    ↓
FastAPI → Cosmos DB (persistence)
```

## How It Works

### Current Implementation (Cosmos Only)
1. User edits outline locally
2. Changes save to Cosmos via API
3. Cosmos stores hierarchical JSON document
4. Perfect for single-user scenarios

### With Fluid Framework (Future)
1. User opens outline → Load from Cosmos
2. Create Fluid session → Initialize SharedTree
3. Multiple users edit → Fluid syncs changes
4. Periodic save → Persist to Cosmos
5. Session ends → Final save to Cosmos

## Code Example

### Phase 2: Direct Cosmos Save
```python
# backend/app/services/outline_service.py
async def update_outline(outline_id: str, items: list):
    """Direct save to Cosmos DB"""
    doc = {
        "id": outline_id,
        "items": items,  # Hierarchical JSON
        "updatedAt": datetime.utcnow()
    }
    await cosmos_client.upsert_document(doc)
```

### Phase 3: Fluid + Cosmos Hybrid
```typescript
// frontend/src/services/fluidService.ts
class FluidOutlineService {
    private container: IFluidContainer;
    private sharedTree: SharedTree;
    
    async loadOutline(outlineId: string) {
        // 1. Load from Cosmos
        const cosmosData = await api.getOutline(outlineId);
        
        // 2. Initialize Fluid session
        this.container = await client.getContainer(outlineId);
        this.sharedTree = container.initialObjects.tree;
        
        // 3. Populate SharedTree
        this.sharedTree.initialize(cosmosData.items);
        
        // 4. Auto-save to Cosmos
        this.sharedTree.on("afterChange", debounce(() => {
            this.saveToComos();
        }, 30000));
    }
    
    private async saveToComos() {
        const items = this.sharedTree.toJSON();
        await api.updateOutline(this.outlineId, items);
    }
}
```

## Why This Architecture?

### Cosmos DB Strengths
- **Perfect JSON fit**: Outlines are already hierarchical JSON
- **Fast point reads**: <10ms latency for document fetch
- **User isolation**: Partition by userId
- **Cost-effective**: Free tier handles significant load

### Fluid Framework Strengths (When Needed)
- **Real-time sync**: Multiple users see changes instantly
- **Conflict resolution**: Automatic handling of concurrent edits
- **Offline support**: Local changes sync when reconnected
- **Optimistic updates**: No waiting for server confirmation

## Implementation Timeline

### Now (Phase 2): Build Cosmos Backend
✅ Complete backend tests (TDD)
⬜ Implement FastAPI endpoints
⬜ Connect to Cosmos DB
⬜ Pass all tests

### Later (Phase 3+): Add Collaboration
⬜ Evaluate if users need real-time collaboration
⬜ Add Fluid Framework if required
⬜ Keep Cosmos as source of truth

## Cost Analysis

### Cosmos Only (Current Plan)
- Free tier: 1000 RU/s, 25GB storage
- Sufficient for ~10,000 active users
- Monthly cost: $0

### Cosmos + Fluid (Future)
- Cosmos: Same as above
- Fluid Relay: $0.015 per hour per session
- Estimated: $50-200/month for 1000 daily users

## Decision Points

### Stay with Cosmos Only If:
- Single-user editing is sufficient
- Auto-save every 30 seconds is acceptable
- Cost minimization is priority

### Add Fluid Framework When:
- Users demand real-time collaboration
- Multiple users edit same outline simultaneously
- You need conflict-free concurrent editing

## Next Steps

1. **Complete Phase 2**: Implement Cosmos backend
2. **Monitor Usage**: Track if users need collaboration
3. **Prototype Fluid**: Test integration in Phase 3
4. **Gradual Rollout**: Enable Fluid per-outline as needed

---

*Last Updated: January 2025*
*Architecture: Cosmos DB for storage, Fluid Framework optional for collaboration*