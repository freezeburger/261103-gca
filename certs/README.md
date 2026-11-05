# Certificat HTTPS de développement

`ng serve` sert l'application en HTTPS avec `localhost.crt` et `localhost.key` (voir `angular.json` > `serve.options`). Ces fichiers ne sont **pas versionnés**.

Pour les (re)générer :

1. Ouvrir <https://www.selfsignedcert.com/generate> et choisir **Self-signed TLS**.
2. *Common name* : `localhost` ; SAN : `localhost`, `*.localhost`, `127.0.0.1` ; validité : 1 an ; clé RSA 2048 bits.
3. Cliquer **Generate in this browser** (la clé est créée dans l'onglet, rien n'est envoyé).
4. Télécharger le `.crt` et le `.key`, puis les enregistrer ici sous `localhost.crt` et `localhost.key`.
5. Optionnel : importer `localhost.crt` dans le magasin « Autorités de certification racines de confiance » de l'utilisateur pour supprimer l'avertissement du navigateur.

Contrôle de cohérence de la paire :

```bash
node -e "const c=require('crypto'),f=require('fs');console.log(new c.X509Certificate(f.readFileSync('certs/localhost.crt')).checkPrivateKey(c.createPrivateKey(f.readFileSync('certs/localhost.key'))))"
```
