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
    volumes:
      - /your/mount:/your/download/path
    ports:
      - 3000:3000
    restart: unless-stopped
```