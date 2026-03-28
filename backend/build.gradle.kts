import org.springframework.boot.gradle.tasks.bundling.BootJar

plugins {
    java
    id("org.springframework.boot") version "4.0.1"
    id("io.spring.dependency-management") version "1.1.7"
    id("org.graalvm.buildtools.native") version "0.11.2"
}

group = "com.sweng"

version = "0.0.1-SNAPSHOT"

description = "Sweng Group 26 Backend"

java { toolchain { languageVersion = JavaLanguageVersion.of(25) } }

repositories { mavenCentral() }

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-json")

    implementation("io.jsonwebtoken:jjwt-api:0.11.5")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.11.5")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.11.5")

    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.projectlombok:lombok")
    annotationProcessor("org.projectlombok:lombok")
    developmentOnly("org.springframework.boot:spring-boot-devtools")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
    testImplementation("org.springframework.boot:spring-boot-test-autoconfigure")
    testImplementation("org.springframework:spring-test")
    testImplementation("org.springframework.security:spring-security-test")
    testImplementation("com.h2database:h2")
    testImplementation("net.jqwik:jqwik:1.9.3")

    runtimeOnly("org.postgresql:postgresql")
    implementation("me.paulschwarz:spring-dotenv:4.0.0")
}

tasks.withType<Test> { useJUnitPlatform() }

tasks.withType<Javadoc> {
    options.encoding = "UTF-8"
    setFailOnError(true)
    val options = options as StandardJavadocDocletOptions
    options.addBooleanOption("Xdoclint:missing", true)
    options.addBooleanOption("Werror", true)
    options.addStringOption("Xmaxwarns", "1000")
}

tasks.named<BootJar>("bootJar") { archiveFileName.set("backend.jar") }

graalvmNative {
    binaries {
        named("main") {
            imageName.set("backend")
            sharedLibrary.set(false)
            buildArgs.add("--initialize-at-build-time=ch.qos.logback.classic.Logger")
            buildArgs.add("--verbose")
            buildArgs.add("--add-opens=java.base/java.nio=ALL-UNNAMED")
            buildArgs.add("--add-opens=java.base/jdk.internal.misc=ALL-UNNAMED")
            buildArgs.add("--add-opens=java.base/jdk.internal.ref=ALL-UNNAMED")
            buildArgs.add("--trace-class-initialization=ch.qos.logback.classic.Logger")
            buildArgs.add(
                "--initialize-at-build-time=org.slf4j.LoggerFactory,ch.qos.logback,org.slf4j.helpers",
            )
            buildArgs.add("--initialize-at-run-time=io.netty")
            buildArgs.add("-H:ReflectionConfigurationFiles=../../../reflection-config.json")
        }
    }
    metadataRepository { enabled.set(true) }
}
