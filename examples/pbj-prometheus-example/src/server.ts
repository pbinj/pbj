import express from "express";
import { apply } from "@pbinj/pbj-prometheus";

const app = express();

apply(app);
