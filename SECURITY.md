# Security Policy

## About the project

UnoShrekApi is an academic project (capstone) developed for learning purposes, implementing the backend for a multiplayer UNO game. As this is an educational project rather than a production system with real users, this policy reflects that nature.

## Supported versions

Since the project is under continuous development, security issues are addressed only for the main development branch.

| Version | Supported |
| ------------------- | ------------------ |
| `main` (latest) | :white_check_mark: |
| Previous versions | :x: |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, we appreciate responsible reporting.

### How to report

- Open a **private issue** (if the repository supports "Private Vulnerability Reporting" in GitHub Security settings), or
- Kauã Henrique Gonçalves
- Rodrigo Costa Albuquerque
- Pedro Lucas Farias de Melo
- Davi Correia de Oliveira

**Please do not open a public issue** for vulnerabilities, to avoid exposure before a fix is ​​implemented. ### What to include in the report

- Description of the vulnerability and potential impact
- Steps to reproduce the issue
- Affected version/branch/commit
- Suggested fix, if applicable

### What to expect

- **Receipt confirmation:** within 5 business days
- **Initial assessment:** within 10 business days, indicating whether the vulnerability has been accepted, is under review, or has been rejected
- **Resolution:** timeframe depends on complexity and time availability, as this is a student project conducted alongside academic activities

### Scope

As this is a learning project, vulnerabilities related to the following areas are particularly welcome, as they directly align with the project's learning objectives:
- Authentication and authorization (JWT, cookies)
- Input validation (Zod DTOs)
- Injection (NoSQL, XSS)
- Sensitive data exposure
