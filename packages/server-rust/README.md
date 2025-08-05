# XDCC Mule - Rust Server

This is the Rust migration of the Node.js XDCC Mule server using actix-web.

## Current Status

✅ **Completed:**
- Basic actix-web server setup
- Configuration management 
- API routes structure (/api/files, /api/downloads)
- Database integration with SQLite (in-memory)
- XDCC database parsing and search functionality
- Static file serving
- Periodic database refresh via cron scheduler
- Download status management (basic structure)

🔄 **In Progress:**
- XDCC download functionality (currently stubbed)

⚠️ **TODO:**
- Implement actual XDCC/IRC client functionality for downloads
- Add proper error handling and validation
- Add logging improvements
- Add configuration file support
- Add tests

## API Endpoints

### Files
- `GET /api/files?name=<search_term>` - Search for files
- `DELETE /api/files` - Refresh the XDCC database

### Downloads  
- `GET /api/downloads?status=<status>` - Get downloads (optionally filtered by status)
- `POST /api/downloads` - Start a new download
- `DELETE /api/downloads` - Cancel a download

## Environment Variables

Required:
- `DATABASE_URL` - URL to the XDCC database source

Optional:
- `NICKNAME` - IRC nickname (default: "xdcc-mule") 
- `DOWNLOAD_PATH` - Download directory (default: "./")
- `PORT` - Server port (default: 3000)

## Running

```bash
# Set required environment variable
export DATABASE_URL="your_database_url_here"

# Build and run
cargo run
```

## Dependencies

- **actix-web** - Web framework
- **actix-files** - Static file serving
- **rusqlite** - SQLite database
- **reqwest** - HTTP client
- **serde** - JSON serialization
- **tokio-cron-scheduler** - Cron job scheduling
- **anyhow** - Error handling

## Migration Notes

This server replicates the API structure and functionality of the original Node.js version with the following differences:

1. **Database**: Still uses in-memory SQLite like the original
2. **Cron Jobs**: Uses `tokio-cron-scheduler` instead of `node-cron` 
3. **HTTP Client**: Uses `reqwest` instead of `undici`
4. **XDCC Downloads**: The core XDCC/IRC functionality is currently stubbed and needs implementation
   - Original used `xdccjs` library
   - Rust equivalent would need to be implemented or found
   - This is the main remaining work item

## Architecture

```
src/
├── main.rs              # Server entry point
├── config.rs            # Configuration management
├── routes/              # API route handlers
│   ├── mod.rs
│   ├── api.rs           # Route configuration
│   ├── files.rs         # File search endpoints
│   └── downloads.rs     # Download management endpoints
└── utils/               # Core utilities
    ├── mod.rs           # Common types and utilities
    ├── xdcc_database.rs # Database operations
    └── xdcc_download.rs # Download management (stub)
```
