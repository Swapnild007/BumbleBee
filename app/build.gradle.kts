plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.swapnild.jarvis"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.swapnild.jarvis"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
    }

    buildFeatures {
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.webkit:webkit:1.12.1")
}

val syncJarvisWebAssets by tasks.registering(Copy::class) {
    from(rootProject.file("index.html"))
    from(rootProject.file("orb-engine.js"))
    from(rootProject.file("sw.js"))
    from(rootProject.file("manifest.webmanifest"))
    into(layout.projectDirectory.dir("src/main/assets/www"))
    from(rootProject.file("training/intents.json")) {
        into("training")
    }
}

tasks.named("preBuild").configure {
    dependsOn(syncJarvisWebAssets)
}
