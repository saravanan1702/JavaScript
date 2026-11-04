#!/usr/bin/env bash
# Builds Gear & Clutch Race as an Android APK (no Gradle / Android Studio needed).
# Needs: Java, and the Ubuntu packages
#   aapt apksigner zipalign dalvik-exchange android-sdk-platform-23
# Usage: ./build.sh [output.apk]
set -euo pipefail
cd "$(dirname "$0")"

ANDROID_JAR=${ANDROID_JAR:-/usr/lib/android-sdk/platforms/android-23/android.jar}
OUT=${1:-build/GearClutchRace.apk}
KEYSTORE=${KEYSTORE:-$HOME/.android/gearclutch.keystore}
B=build

rm -rf "$B" && mkdir -p "$B/classes" "$B/assets" "$B/gen"

# 1. Game files go in as app assets
cp ../index.html ../style.css ../script.js "$B/assets/"

# 2. Launcher icons
python3 make_icon.py

# 3. Compile resources + R.java
aapt package -f -m -J "$B/gen" -M AndroidManifest.xml -S res -I "$ANDROID_JAR"

# 4. Java -> .class -> classes.dex
javac -source 8 -target 8 -nowarn -Xlint:-options -encoding UTF-8 \
  -bootclasspath "$ANDROID_JAR" -d "$B/classes" \
  "$B"/gen/com/saravanan/gearclutch/R.java src/com/saravanan/gearclutch/*.java
dalvik-exchange --dex --output="$B/classes.dex" "$B/classes"

# 5. Package, add dex, align
aapt package -f -M AndroidManifest.xml -S res -A "$B/assets" -I "$ANDROID_JAR" \
  -F "$B/unsigned.apk"
(cd "$B" && aapt add unsigned.apk classes.dex >/dev/null)
zipalign -f -p 4 "$B/unsigned.apk" "$B/aligned.apk"

# 6. Sign (creates a local signing key the first time)
if [ ! -f "$KEYSTORE" ]; then
  mkdir -p "$(dirname "$KEYSTORE")"
  keytool -genkeypair -keystore "$KEYSTORE" -storepass android -keypass android \
    -alias gearclutch -keyalg RSA -keysize 2048 -validity 10000 \
    -dname "CN=Gear Clutch Race" >/dev/null 2>&1
fi
mkdir -p "$(dirname "$OUT")"
apksigner sign --ks "$KEYSTORE" --ks-pass pass:android --key-pass pass:android \
  --ks-key-alias gearclutch --out "$OUT" "$B/aligned.apk"
apksigner verify "$OUT"
echo "APK ready: $OUT ($(du -h "$OUT" | cut -f1))"
