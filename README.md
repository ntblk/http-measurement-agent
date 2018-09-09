## NetBlocks HTTP Probe Agent

<img src="https://netblocks.org/images/art/netblocks-probe-agent.png" width="200px" align="right" />

[![NPM Version][npm-image]][npm-url]

The ``http-measurement-agent`` seamlessly adds timing and measurement instrumentation to the standard HTTP networking stack. It provides detailed and accurate timings of asynchronous network transactions. It also adds integration points for interop with more sophisticated timing and packet capture facilities.

``http-measurement-agent`` provides an unobtrusive programming interface that can be used as part of any project that needs to track resource timing.

<img src="https://netblocks.org/files/netblocks-logo.png" width="200px" align="left" alt="NetBlocks" style="margin: 0.5em;" />

This module has been built designed to work well with [pcap-engine](https://github.com/ntblk/pcap-engine) and [pcap-sanitizer](https://github.com/ntblk/pcap-sanitizer), which together form a modular network measurement platform.

``http-measurement-agent`` can also serve as a drop in measurement module for [probe-hub](https://github.com/ntblk/probe-hub).

## Synopsis

``http-measurement-agent`` hooks into the HTTP stack with extension points that permit passive probing of network performance and fine-grained collection of network traffic.

This package is maintained as part of the the
[NetBlocks.org](https://netblocks.org) network observation framework.

## Features

* High-precision DNS and HTTP request, response and body transfer timing
* Source/destination host and port accounting
* Entry points to enable automated network traffic collection

## Getting started: Usage and integration

### Developer API

#### Installation

```bash
$ npm install http-measurement-agent
```

The ``http-measurement-agent`` extends http request and response objects with a custom field that carries extended instrumentation data.

In typical usage, this module will be used to wrap the global or per-instance http/https implementations so that network activity can be seamlessly measured.

User code will generally use a higher-level abstraction like ``request`` or ``axios``, unless there are specific needs requiring closer access to the platform's network facilities.

[npm-image]: https://img.shields.io/npm/v/http-measurement-agent.svg?style=flat-square
[npm-url]: https://npmjs.org/package/http-measurement-agent
[npm-downloads]: https://img.shields.io/npm/dm/http-measurement-agent.svg?style=flat-square
