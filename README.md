# xdcc-mule

This tool aims to be a NodeJS porting of the homonymous tool written for mIRC.

## Usage

It is available as docker image: ```ilteoood/xdcc-mule```.

## Configuration

```yaml
version: "2"
services:
  transmission:
    image: ilteoood/xdcc-mule
    container_name: xdcc-mule
    environment:
      - DATABASE_URL=your-db-url
      - NICKNAME=your-nickname
      - DOWNLOAD_PATH=/your/download/path
      - EXCLUDED_CHANNELS=#channel1,#channel2
    volumes:
      - /your/mount:/your/download/path
    ports:
      - 3000:3000
    restart: unless-stopped
```

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | URL of the XDCC database | Yes | - |
| `NICKNAME` | IRC nickname to use | No | `xdcc-mule` |
| `DOWNLOAD_PATH` | Path where files will be downloaded | No | `./` |
| `PORT` | Server port | No | `3000` |
| `EXCLUDED_CHANNELS` | Comma-separated list of channel names to exclude from the database | No | - |