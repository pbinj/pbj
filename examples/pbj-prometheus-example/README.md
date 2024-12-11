# @pbinj/pbj-prometheus-example

> This is an example of how you can use [prometheus](https://prometheus.io/) to monitor the inner workings of the bean contexts. It measures how long invocations takes.

## Requirements

- Docker
- pnpm/yarn/npm
- node runtime

## Getting started

`prom-client` is a node package that sends metrics back to prometheus server. It is a peerDependency of `@pbinj/pbj-metric`, so you will need to install it seperately.

### Install packages

```sh
$ npm install @pbinj/pbj-metric @pbinj/pbj
$ npm install prom-client
```

```sh
$ yarn add @pbinj/pbj-metric @pbinj/pbj
$ yarn add prom-client
```

```sh
$ pnpm add @pbinj/pbj-metric @pbinj/pbj
$ pnpm add prom-client

```

### Start you prometheus server

Included in the example is a prometheus demo server. Start it using docker.

```sh
$ pnpm run prometheus
```

### Run the example package

```sh
$ pnpm run start
```

### Open the prometheus dashboard

You can view the [http://localhost:3000](http://localhost:3000) to see what endpoints are published.

You should be able to see the published metrics at [http://localhost:9090](http://localhost:9090).
