module.exports = {
    "apps": [
        {
            "name": "crawler",
            "script": "./bin/www",
            "instances": "max",
            "exec_mode": "cluster",
            "env": {
                "NODE_ENV": "production",
                "HTTP": "false",
                "PORT": 8000,
                "LOG_LEVEL": "warn"
            },
            "error_file": "./logs/pm2.err",
            "out_file": "./logs/pm2.log"
        }
    ]
}