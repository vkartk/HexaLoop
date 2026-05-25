FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY apps/api/api.csproj apps/api/api.csproj
RUN dotnet restore apps/api/api.csproj

COPY apps/api apps/api
RUN dotnet publish apps/api/api.csproj -c Release -o /out --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /out .
EXPOSE 5080
ENV ASPNETCORE_URLS=http://+:5080
ENTRYPOINT ["dotnet", "HexaLoop.Api.dll"]
