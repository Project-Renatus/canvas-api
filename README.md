### Canvas API
This API takes in canvas options (base64) from URL and draw it

Example JSON
```
{
    "height": 360,
    "width": 640,
    "1": {
        "type": "image",
        "content": "basd64 image",
        "opacity": 1,
        "startX": 0,
        "startY": 0,
        "endX": 640,
        "endY": 360
    },
    "2": {
        "type": "solid",
        "color": "#000000",
        "opacity": 0.5,
        "startX": 10,
        "startY": 10,
        "endX": 630,
        "endY": 350
    },
    "3": {
        "type": "image",
        "content": "base64 image",
        "startX": 100,
        "startY": 100,
        "endX": 250,
        "endY": 250,
        "cropper": "circle",
        "opacity": 1
    }
}
```

By encoding this json and pass it from URL, the API returns the image