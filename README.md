# Prototype integration of create.js in Apache Sling

This is a (very rough for now) prototype that allows Sling content to be edited from 
[create.js](https://github.com/bergie/create).

To test this:
- Start Sling
- Configure "Allow Anonymous Accees = false" in the Authentication Service config at /system/console (login: admin/admin).
- Build and install this bundle
- Edit at http://localhost:8080/content/createjs.html (login: admin/admin)
- Check results at http://localhost:8080/content/createjs.tidy.json
