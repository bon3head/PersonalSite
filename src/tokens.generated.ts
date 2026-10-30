// GENERATED from spec/astryx/DESIGN.md v1.0.0. Do not edit.
export const T = {
  "version": "1.0.0",
  "color": {
    "void": {
      "ground": "#0A0C0F",
      "raised": "#15171B",
      "text": "#E6E8EA",
      "text2": "#A7ABB0",
      "accent": "#7BB5F8",
      "hairline": "#E6E8EA21"
    },
    "paper": {
      "ground": "#F3F0EA",
      "raised": "#E6E2DC",
      "text": "#14161A",
      "text2": "#4E5359",
      "accent": "#0E3565",
      "hairline": "#14161A26"
    },
    "field": {
      "ground": "#10294E",
      "raised": "#183662",
      "text": "#F5F1E9",
      "text2": "#B6C6D7",
      "accent": "#7BB5F8",
      "hairline": "#F5F1E929"
    },
    "signal": "#7BB5F8",
    "signalDim": "#4F77A5",
    "signalHot": "#D4E7FC",
    "ink": "#0E3565",
    "inkTint": "#C9DCEA",
    "chalk": "#F5F1E9",
    "chalk2": "#B6C6D7",
    "errorDark": "#F47B74",
    "errorLight": "#B02A2D",
    "accentMutedLight": "#0E35651F",
    "accentMutedDark": "#7BB5F829"
  },
  "contrastPairs": [
    [
      "void.text",
      "void.ground",
      4.5
    ],
    [
      "void.text2",
      "void.ground",
      4.5
    ],
    [
      "signal",
      "void.ground",
      4.5
    ],
    [
      "signal",
      "void.raised",
      4.5
    ],
    [
      "signalDim",
      "void.ground",
      3
    ],
    [
      "void.text",
      "void.raised",
      4.5
    ],
    [
      "paper.text",
      "paper.ground",
      4.5
    ],
    [
      "paper.text2",
      "paper.ground",
      4.5
    ],
    [
      "paper.text2",
      "paper.raised",
      4.5
    ],
    [
      "ink",
      "paper.ground",
      4.5
    ],
    [
      "ink",
      "paper.raised",
      4.5
    ],
    [
      "ink",
      "inkTint",
      4.5
    ],
    [
      "chalk",
      "field.ground",
      4.5
    ],
    [
      "chalk2",
      "field.ground",
      4.5
    ],
    [
      "chalk",
      "field.raised",
      4.5
    ],
    [
      "chalk2",
      "field.raised",
      4.5
    ],
    [
      "signal",
      "field.ground",
      4.5
    ],
    [
      "void.ground",
      "signal",
      4.5
    ],
    [
      "paper.ground",
      "ink",
      4.5
    ],
    [
      "errorDark",
      "void.ground",
      4.5
    ],
    [
      "errorLight",
      "paper.ground",
      4.5
    ]
  ],
  "type": {
    "family": "\"Commit Mono\", \"Commit Mono Fallback\", ui-monospace, \"SF Mono\", Menlo, Consolas, monospace",
    "fontPackage": "@fontsource/commit-mono@5.2.5",
    "weights": [
      200,
      400,
      700
    ],
    "preloadWeight": 400,
    "scale": {
      "base": 16,
      "ratio": 1.25
    },
    "display0": {
      "size": "clamp(3.5rem, 9.5vw, 8rem)",
      "weight": 400,
      "leading": 0.95,
      "tracking": "-0.04em"
    },
    "display1": {
      "size": "clamp(2.25rem, 6vw, 4.5rem)",
      "weight": 700,
      "leading": 1,
      "tracking": "-0.03em"
    },
    "key": {
      "size": "13px",
      "weight": 700
    },
    "minSizePx": 13,
    "measureCh": 52
  },
  "space": {
    "gutterPx": {
      "base": 16,
      "from640": 32,
      "from1280": 48
    },
    "keymapHeightPx": {
      "coarse": 44,
      "fine": 36
    },
    "readoutMaxWidthPx": 520
  },
  "radius": {
    "base": 2,
    "multiplier": 1,
    "used": [
      "--radius-none",
      "--radius-element"
    ]
  },
  "size": {
    "elementPx": {
      "sm": 32,
      "md": 36,
      "lg": 44
    },
    "coarseMinTargetPx": 44
  },
  "focus": {
    "widthPx": 2,
    "offsetPx": 3
  },
  "motion": {
    "easePlain": "ease",
    "easePlainBezier": [
      0.25,
      0.1,
      0.25,
      1
    ],
    "easeSignature": [
      0.23,
      1,
      0.32,
      1
    ],
    "astryxMotion": {
      "fast": 150,
      "medium": 300,
      "ratio": 0.67
    },
    "ms": {
      "fastMin": 100,
      "fast": 150,
      "fastMax": 225,
      "mediumMin": 200,
      "medium": 300,
      "travel": 700,
      "ripple": 900,
      "word": 2600,
      "wordCadence": 1100,
      "readoutInDelay": 400
    },
    "spring": {
      "dampingRatio": 0.7,
      "frequencyHz": 3.2
    },
    "leaflinkEventIntervalMs": [
      1000,
      1600
    ],
    "feedbackMaxMs": 250
  },
  "world": {
    "laneCount": 6144,
    "pointsPerLane": 8,
    "segmentsPerLane": 7,
    "layouts": [
      "server",
      "leaflink",
      "sidequests",
      "scatter"
    ],
    "layoutTexture": {
      "width": 256,
      "height": 768,
      "format": "RGBA32F"
    },
    "activityTexture": {
      "width": 256,
      "height": 24,
      "format": "RGBA32F"
    },
    "seed": 20271201,
    "dprCap": {
      "fine": 2,
      "coarse": 1.75,
      "floor": 1
    },
    "server": {
      "sm": {
        "count": 48,
        "cols": 8,
        "rows": 6,
        "pitch": [
          0.95,
          0.85
        ]
      },
      "partition": {
        "perSm": 4,
        "cols": 2,
        "rows": 2,
        "pitch": [
          0.27,
          0.23
        ]
      },
      "lane": {
        "perPartition": 32,
        "cols": 8,
        "rows": 4,
        "pitch": [
          0.03,
          0.05
        ]
      },
      "zStraight": [
        -24,
        -2
      ],
      "convergeZ": [
        0.4,
        2.2
      ],
      "convergeMix": [
        0.5,
        0.92
      ],
      "focus": [
        0,
        0,
        2.2
      ],
      "classes": {
        "lane": {
          "widthPx": 1,
          "alpha": 0.08
        },
        "converge": {
          "widthPx": 1,
          "alpha": 0.08
        }
      },
      "fire": {
        "warpSize": 32,
        "speedLengthsPerSec": 0.55,
        "sigma": 0.05,
        "dutyCycle": 0.6,
        "periodSec": [
          3,
          7
        ],
        "sweepPeriodSec": 6,
        "peakAlpha": 1
      },
      "words": [
        "Go TUI",
        "Ollama",
        "Tailscale",
        "Docker",
        "Open WebUI",
        "WSL2 Ubuntu",
        "Windows 11",
        "RTX 3070 Ti",
        "Smithtown, NY"
      ],
      "wordSize": 0.32,
      "wordDrift": [
        -1,
        0.5,
        1
      ],
      "wordPool": 6,
      "wordSpawnOffsetZ": 0.2,
      "wordColorStops": [
        0,
        0.4,
        1
      ],
      "wordFadeFrom": 0.55,
      "reducedWordAt": [
        0.2,
        0.5,
        0.8
      ],
      "fog": [
        7,
        30
      ]
    },
    "leaflink": {
      "extent": [
        40,
        40
      ],
      "lattice": {
        "nodes": 33,
        "pitch": 1.25,
        "jitter": 0.28
      },
      "edgeDropFraction": 0.12,
      "diagonalAddFraction": 0.04,
      "arterialEvery": 8,
      "classes": {
        "local": {
          "widthPx": 1.2,
          "alpha": 0.3
        },
        "arterial": {
          "widthPx": 2.2,
          "alpha": 0.55
        },
        "route": {
          "widthPx": 3,
          "alpha": 1
        }
      },
      "pins": {
        "maxPins": 24,
        "maxMatches": 6,
        "matchMaxHops": 9,
        "radiusWorld": 0.32,
        "holdMs": 4000,
        "fadeMs": 600,
        "dropScaleFrom": 1.6,
        "rippleScaleTo": 3,
        "rippleAlphaFrom": 0.4,
        "requestFraction": 0.55,
        "minSpacingHops": 2,
        "haloScale": 2.2,
        "staleMs": 20000,
        "ringInner": 0.62,
        "rippleInner": 0.86,
        "radiusPx": {
          "fine": 7,
          "coarse": 8
        },
        "firstEventAfterMs": 300,
        "reducedPins": 6,
        "reducedMatches": 3,
        "visitorRequestHops": [
          3,
          6
        ]
      },
      "routeSpeedUnitsPerSec": 6,
      "tapMaxMovePx": 6,
      "tapMaxMs": 500,
      "arterialJitterScale": 0.5
    },
    "sidequests": {
      "extent": [
        36,
        28
      ],
      "allocation": {
        "grid": 2080,
        "outlinesTarget": 400,
        "walkwaysTarget": 600,
        "trailsTarget": 180,
        "hatch": "remainder"
      },
      "gridPitch": 1,
      "buildings": {
        "count": 11,
        "minSide": 2,
        "maxSide": 6.5,
        "lShapeFraction": 0.35,
        "minGap": 1.2,
        "region": [
          [
            -16,
            16
          ],
          [
            -12,
            10
          ]
        ],
        "lShapeCut": [
          0.3,
          0.5
        ],
        "maxAttempts": 500
      },
      "hatchAngleDeg": 45,
      "hatchSpacing": 0.35,
      "walkways": 9,
      "trails": {
        "count": 3,
        "dashLength": 0.3,
        "gapLength": 0.2,
        "start": [
          0,
          0,
          13
        ]
      },
      "classes": {
        "grid": {
          "widthPx": 1,
          "alpha": 0.1
        },
        "outline": {
          "widthPx": 1.6,
          "alpha": 0.85
        },
        "hatch": {
          "widthPx": 1,
          "alpha": 0.22
        },
        "walkway": {
          "widthPx": 1.4,
          "alpha": 0.45
        },
        "trail": {
          "widthPx": 2,
          "alpha": 0.55
        },
        "trailLit": {
          "widthPx": 2.6,
          "alpha": 1
        }
      },
      "marker": {
        "radius": 0.35,
        "squashY": 1.4,
        "poleHeight": 0.8,
        "poleRadius": 0.02,
        "bobAmp": 0.06,
        "bobPeriodSec": 2.4,
        "hitRadiusPx": 22,
        "claimScale": 1.25,
        "riseStaggerMs": 80,
        "hoverLift": 0.15,
        "claimDrop": 0.6,
        "bobPhases": [
          0,
          2.1,
          4.2
        ]
      },
      "trailDrawUnitsPerSec": 14,
      "outlineLaneLength": 0.5,
      "walkwayLaneLength": 0.4,
      "walkwayOffset": [
        0.15,
        0.3
      ],
      "waypointFractions": [
        0.25,
        0.5,
        0.75
      ],
      "waypointOffset": 3,
      "footprintMargin": 0.8,
      "markerMinFromStart": 8,
      "markerMinApart": 9,
      "hatchSpacingGrow": 1.1,
      "trailMaxOverlap": 2,
      "cameraFollow": {
        "weight": 0.25,
        "halfLifeMs": 400
      }
    },
    "scatter": {
      "radius": 8,
      "segLength": [
        0.2,
        0.6
      ],
      "classes": {
        "lane": {
          "widthPx": 1,
          "alpha": 0.22
        }
      }
    },
    "camera": {
      "server": {
        "fine": {
          "pos": [
            -7,
            2.4,
            8
          ],
          "target": [
            0.5,
            0,
            -3
          ],
          "fovDeg": 48,
          "shiftNdc": [
            0.58,
            0
          ]
        },
        "coarse": {
          "pos": [
            -3.5,
            3,
            12
          ],
          "target": [
            0.3,
            0,
            -3
          ],
          "fovDeg": 58,
          "shiftNdc": [
            0,
            -0.4
          ]
        }
      },
      "leaflink": {
        "fine": {
          "pos": [
            0,
            30,
            21
          ],
          "target": [
            0,
            0,
            1.5
          ],
          "fovDeg": 34,
          "shiftNdc": [
            0,
            0
          ]
        },
        "coarse": {
          "pos": [
            0,
            34,
            18
          ],
          "target": [
            0,
            0,
            1.5
          ],
          "fovDeg": 42,
          "shiftNdc": [
            0,
            0.18
          ]
        }
      },
      "sidequests": {
        "fine": {
          "pos": [
            6,
            24,
            16
          ],
          "target": [
            0,
            0,
            0
          ],
          "fovDeg": 36,
          "shiftNdc": [
            -0.18,
            0
          ]
        },
        "coarse": {
          "pos": [
            3,
            30,
            14
          ],
          "target": [
            0,
            0,
            0
          ],
          "fovDeg": 46,
          "shiftNdc": [
            0,
            -0.22
          ]
        }
      },
      "scatter": {
        "fine": {
          "pos": [
            0,
            0,
            14
          ],
          "target": [
            0,
            0,
            0
          ],
          "fovDeg": 40,
          "shiftNdc": [
            0,
            0
          ]
        },
        "coarse": {
          "pos": [
            0,
            0,
            18
          ],
          "target": [
            0,
            0,
            0
          ],
          "fovDeg": 52,
          "shiftNdc": [
            0,
            0
          ]
        }
      },
      "near": 0.1,
      "far": 120,
      "idleYawDeg": {
        "server": 3,
        "leaflink": 0,
        "sidequests": 2,
        "scatter": 4
      },
      "idleYawPeriodSec": {
        "server": 20,
        "sidequests": 30,
        "scatter": 24
      },
      "leaflinkDrift": {
        "amp": [
          3,
          2
        ],
        "periodSec": 40
      },
      "parallaxDeg": 1.5,
      "parallaxDampHalfLifeMs": 180
    },
    "governor": {
      "sampleWindowMs": 2000,
      "p90TargetMs": 16.7,
      "stepDownAboveMs": 20,
      "stepUpBelowMs": 12,
      "stepUpAfterMs": 10000,
      "dprStep": 0.25
    }
  },
  "breakpoints": {
    "coarseOrNarrowBelowPx": 768,
    "desktopFromPx": 1024
  },
  "hueBudgetPct": {
    "server": 30,
    "leaflink": 10,
    "sidequestsSignal": 6,
    "scatter": 6
  },
  "budgets": {
    "lcpMs": 2000,
    "ttiMs": 3000,
    "tbtMs": 150,
    "cls": 0.02,
    "longTaskMaxMs": 50,
    "renderBlockingCssGzKb": 45,
    "appShellJsGzKb": 110,
    "worldChunkGzKb": 220,
    "fontPreloadKb": 50,
    "frameP95MsPhone": 16.7,
    "drawCallsMax": 12,
    "gpuMemoryMbMax": 64
  },
  "chrome": {
    "readoutEnterTranslatePx": 8,
    "readoutTopExtraPx": 8,
    "serverReadoutWidth": "min(36vw, 480px)",
    "serverReadoutBottomGap": "calc(3 * var(--spacing-12))",
    "readoutClearPadding": "var(--spacing-6)",
    "legendWidthPx": 360,
    "trailheadWidthPx": 380,
    "trailheadTopExtraPx": 40,
    "coarseReadoutMaxHeight": "46dvh",
    "legendGlyphPx": {
      "ring": 10,
      "dot": 10,
      "bar": [
        16,
        3
      ]
    },
    "keymapNarrowBelowPx": 360,
    "scrimAlpha": 0.6,
    "sheetMaxWidthPx": 640,
    "sheetMaxMs": 300,
    "toastMaxMs": 225,
    "travelDom": {
      "readoutHiddenAtMs": 150,
      "regimeSwitchAtMs": 350,
      "readoutInDelayMs": 400,
      "reducedRegimeSwitchAtMs": 150
    }
  },
  "a11y": {
    "contrastMoreAlphaScale": 1.4,
    "contrastMoreHairlineAlpha": 0.3
  },
  "posters": {
    "webpQuality": 72,
    "fallbackQuality": 60,
    "maxKb": 90,
    "fine": [
      1440,
      900,
      1
    ],
    "coarse": [
      390,
      844,
      2
    ]
  }
} as const;
