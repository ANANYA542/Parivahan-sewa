# Architecture Notes

This repository is organized around the PRD's four core layers:

1. User interface
2. Core system logic
3. Data layer
4. External and government systems

The initial build keeps the PRD's core entities small:

- User
- Vehicle
- Case
- Service

The mobility intelligence layer is treated as a read-side layer over the same core records.

